const SB_URL = "https://izeayydapmwtnevkzfhm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZWF5eWRhcG13dG5ldmt6ZmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE1NDUsImV4cCI6MjA4NTAxNzU0NX0.wSkyGzqFny606kpwvrg47-sZFP4v_62ozW2Np8EG90A";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

const mapaBatalhas = {
    "001": { nome: "SANGUE NA 7" },
    "002": { nome: "NOVA ERA" },
    "003": { nome: "COALIZÃO" },
    "004": { nome: "PICO" },
    "005": { nome: "BENÇA" },
    "006": { nome: "EDUCA" },
    "007": { nome: "ZN" },
    "008": { nome: "BLACK" },
    "009": { nome: "MKT" }
};

function getFotoUrl(nome) {
    if (!nome || nome === '-' || nome === 'VAGO') return 'img/mc_default.png';
    const slug = nome.toLowerCase().trim().replace(/\s+/g, '_');
    return `img/${slug}.png`;
}

// 1. GERAR RANKING COM AS LOGOS DAS CONQUISTAS
async function gerarRanking() {
    try {
        const { data: ordenado, error: errView } = await supabaseClient.from('ranking_geral').select('*');
        if (errView) throw errView;

        const { data: participacoes, error: errPart } = await supabaseClient.from('participacoes').select('mc_nome, batalha_id, folhinhas');
        if (errPart) throw errPart;

        const corpo = document.getElementById('corpo-ranking');
        if (!corpo) return;

        corpo.innerHTML = ordenado.map((item, i) => {
            const vitoriasMc = participacoes.filter(p => p.mc_nome === item.mc_nome && p.folhinhas > 0);
            
            const medalhas = {};
            vitoriasMc.forEach(v => {
                medalhas[v.batalha_id] = (medalhas[v.batalha_id] || 0) + 1;
            });

            const badgesHtml = Object.keys(medalhas).map(batId => {
                const qtd = medalhas[batId];
                const multiplicador = qtd > 1 ? `<span class="badge-multi">${qtd}x</span>` : "";
                return `
                    <div class="medalha-item" title="${mapaBatalhas[batId]?.nome || 'Batalha'}">
                        <img src="img/bat${batId}.png" onerror="this.src='img/default_bat.png'">
                        ${multiplicador}
                    </div>`;
            }).join('');

            return `
            <tr>
                <td style="font-weight:bold; color:var(--primary); font-size: 1.1rem;">${i+1}º</td>
                <td>
                    <div style="display:flex; align-items:center">
                        <div class="foto-container">
                            <img src="${getFotoUrl(item.mc_nome)}" class="foto-mc" onerror="this.src='img/mc_default.png'">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:2px">
                            <span class="mc-name">${item.mc_nome.toUpperCase()}</span>
                            <div class="medalhas-container">${badgesHtml}</div>
                        </div>
                    </div>
                </td>
                <td align="center"><span class="pts-badge">${item.total_pontos}</span></td>
                <td align="center" style="font-weight: bold; color: #777;">${item.total_twolalas}</td>
                <td align="center" style="font-weight: bold; color: var(--primary);">${item.total_folhinhas}</td>
            </tr>`;
        }).join('');

        gerarSidebars();
    } catch (e) { console.error("Erro no ranking:", e); }
}

// AJUSTADO: Sempre exibe o modal de data, mesmo com apenas 1 edição
async function escolherEdicao(idBatalha) {
    try {
        const { data: edicoes, error } = await supabaseClient.from('edicoes')
            .select('id, data_edicao')
            .eq('batalha_id', idBatalha)
            .order('data_edicao', { ascending: false });

        if (error || !edicoes.length) return alert("Nenhuma edição encontrada.");

        // Criar modal de datas (Removido o "if length === 1")
        const modal = document.createElement('div');
        modal.className = 'modal-bracket';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h3 style="color:var(--primary)">EDIÇÕES</h3>
                <div style="display:grid; gap:10px;">
                    ${edicoes.map(ed => `
                        <button onclick="this.parentElement.parentElement.parentElement.remove(); abrirBracket('${ed.id}', true)" class="btn-data">
                            BATALHA DE ${new Date(ed.data_edicao).toLocaleDateString('pt-BR')}
                        </button>
                    `).join('')}
                </div>
            </div>`;
        document.body.appendChild(modal);
    } catch (e) { console.error(e); }
}

async function abrirBracket(idRef, ehIdEdicao = false) {
    try {
        let q = supabaseClient.from('edicoes').select('*');
        if (ehIdEdicao) q = q.eq('id', idRef); 
        else q = q.eq('batalha_id', idRef).order('data_edicao', { ascending: false }).limit(1);
        
        const { data } = await q; if (!data.length) return;
        const ed = data[0], b = ed.bracket_json, p = ed.placares_json, campF = (ed.campeao || "---").toUpperCase();
        
        const renderF = (lista, prefix, titulo) => {
            if (!lista || lista.length === 0 || lista.every(v => v === "-")) return "";
            let html = `<div class="v-round"><h4>${titulo}</h4>`;
            for(let i=0; i<lista.length; i+=2) {
                const n1 = (lista[i] || "-").toUpperCase(), n2 = (lista[i+1] || "-").toUpperCase();
                html += `<div class="matchup"><div class="v-mc-card"><div class="mc-info"><img src="${getFotoUrl(n1)}" class="v-foto-mini"><span class="v-nome">${n1}</span></div><span class="v-placar">${p[prefix+'_'+i]||0}</span></div><div class="v-mc-card"><div class="mc-info"><img src="${getFotoUrl(n2)}" class="v-foto-mini"><span class="v-nome">${n2}</span></div><span class="v-placar">${p[prefix+'_'+(i+1)]||0}</span></div></div>`;
            }
            return html + `</div>`;
        };

        const m = document.createElement('div'); m.className = 'modal-bracket';
        m.innerHTML = `<div class="modal-content"><span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span><div class="bracket-view">${renderF(b.oitavas,'oit','Oitavas')}${renderF(b.quartas,'qua','Quartas')}${renderF(b.semi,'sem','Semi')}${renderF(b.final,'fin','Final')}<div class="v-round"><h4>🏆 Campeão</h4><div class="v-mc-card winner-card"><div class="mc-info"><img src="${getFotoUrl(campF)}" class="v-foto-mini"><span class="v-nome" style="color:var(--primary)">${campF}</span></div></div></div></div></div>`;
        document.body.appendChild(m);
    } catch (e) { console.error(e); }
}

async function gerarSidebars() {
    const L = document.getElementById('lista-left'), R = document.getElementById('lista-right');
    if(!L || !R) return; 
    L.innerHTML = ""; R.innerHTML = "";

    try {
        const { data: ultimasEdicoes } = await supabaseClient
            .from('edicoes')
            .select('batalha_id, data_edicao')
            .order('data_edicao', { ascending: false });

        const datasRecentess = {};
        if (ultimasEdicoes) {
            ultimasEdicoes.forEach(ed => {
                if (!datasRecentess[ed.batalha_id]) {
                    datasRecentess[ed.batalha_id] = new Date(ed.data_edicao).getTime();
                }
            });
        }

        const batalhasOrdenadas = Object.keys(mapaBatalhas).sort((a, b) => {
            return (datasRecentess[b] || 0) - (datasRecentess[a] || 0);
        });

        batalhasOrdenadas.forEach((id, i) => {
            const h = `
                <div class="item-batalha-lateral" onclick="escolherEdicao('${id}')">
                    <img src="img/bat${id}.png" onerror="this.src='img/default_bat.png'">
                    <span>${mapaBatalhas[id].nome}</span>
                </div>`;
            if (i < 5) L.innerHTML += h; else R.innerHTML += h;
        });

    } catch (e) {
        console.error("Erro ao ordenar stories:", e);
    }
}

document.addEventListener('DOMContentLoaded', gerarRanking);