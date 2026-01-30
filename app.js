const SB_URL = "https://izeayydapmwtnevkzfhm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZWF5eWRhcG13dG5ldmt6ZmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE1NDUsImV4cCI6MjA4NTAxNzU0NX0.wSkyGzqFny606kpwvrg47-sZFP4v_62ozW2Np8EG90A";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

const mapaBatalhas = {
    "001": { nome: "SANGUE NA 7" }, "002": { nome: "NOVA ERA" }, "003": { nome: "COALIZÃO" },
    "004": { nome: "PICO" }, "005": { nome: "BENÇA" }, "006": { nome: "EDUCA" },
    "007": { nome: "ZN" }, "008": { nome: "BLACK" }, "009": { nome: "MKT" }
};

function getFotoUrl(nome) {
    if (!nome || nome === '-' || nome === 'VAGO') return 'img/mc_default.png';
    const slug = nome.toLowerCase().trim().replace(/\s+/g, '_');
    return `img/${slug}.png`;
}

async function gerarRanking() {
    try {
        const { data: ordenado } = await supabaseClient.from('ranking_geral').select('*');
        const corpo = document.getElementById('corpo-ranking');
        if (corpo && ordenado) {
            corpo.innerHTML = ordenado.slice(0, 8).map((item, i) => `
                <tr>
                    <td style="color:var(--primary); font-weight:bold;">${i+1}º</td>
                    <td align="left"><div style="display:flex; align-items:center"><img src="${getFotoUrl(item.mc_nome)}" class="foto-mc"><span class="mc-name" style="margin-left:10px">${item.mc_nome}</span></div></td>
                    <td>${item.total_pontos} pts</td>
                    <td style="color:#666">${item.total_twolalas} 2L</td>
                    <td style="color:var(--primary)">${item.total_folhinhas} F</td>
                </tr>
            `).join('');
        }
        gerarSidebars();
    } catch (e) { console.error(e); }
}

async function escolherEdicao(idBatalha) {
    try {
        const { data: edicoes } = await supabaseClient.from('edicoes').select('id, data_edicao').eq('batalha_id', idBatalha).order('data_edicao', { ascending: false });
        if (!edicoes || !edicoes.length) return alert("Nenhuma edição encontrada.");

        const m = document.createElement('div');
        m.className = 'modal-bracket';
        m.innerHTML = `
            <span class="close" onclick="this.parentElement.remove()">&times;</span>
            <div class="modal-content" style="max-width: 400px; margin: auto;">
                <h3 style="color:var(--primary); font-family:'Black Ops One'; text-align:center;">EDIÇÕES</h3>
                ${edicoes.map(ed => `<button onclick="this.parentElement.parentElement.remove(); abrirBracket('${ed.id}', true)" class="btn-data">BATALHA DE ${new Date(ed.data_edicao).toLocaleDateString('pt-BR')}</button>`).join('')}
            </div>`;
        document.body.appendChild(m);
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
            if (!lista || lista.length === 0) return "";
            let html = `<div class="v-round"><h4>${titulo}</h4>`;
            for(let i=0; i<lista.length; i+=2) {
                const n1 = (lista[i] || "-").toUpperCase(), n2 = (lista[i+1] || "-").toUpperCase();
                html += `<div class="matchup">
                    <div class="v-mc-card"><div style="display:flex; align-items:center"><img src="${getFotoUrl(n1)}" class="v-foto-mini"><span class="v-nome">${n1}</span></div><span class="v-placar">${p[prefix+'_'+i]||0}</span></div>
                    <div class="v-mc-card"><div style="display:flex; align-items:center"><img src="${getFotoUrl(n2)}" class="v-foto-mini"><span class="v-nome">${n2}</span></div><span class="v-placar">${p[prefix+'_'+(i+1)]||0}</span></div>
                </div>`;
            }
            return html + `</div>`;
        };

        const m = document.createElement('div'); 
        m.className = 'modal-bracket';
        m.innerHTML = `
            <span class="close" onclick="this.parentElement.remove()">&times;</span>
            <div class="modal-content">
                <div class="bracket-view">
                    ${renderF(b.oitavas,'oit','OITAVAS')}
                    ${renderF(b.quartas,'qua','QUARTAS')}
                    ${renderF(b.semi,'sem','SEMI')}
                    ${renderF(b.final,'fin','FINAL')}
                    <div class="v-round">
                        <h4>🏆 CAMPEÃO</h4>
                        <div class="v-mc-card" style="border-color:var(--primary)"><div style="display:flex; align-items:center"><img src="${getFotoUrl(campF)}" class="v-foto-mini"><span class="v-nome" style="color:var(--primary)">${campF}</span></div></div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(m);
    } catch (e) { console.error(e); }
}

async function gerarSidebars() {
    const L = document.getElementById('lista-left'), R = document.getElementById('lista-right');
    if(!L || !R) return;
    const { data: eds } = await supabaseClient.from('edicoes').select('batalha_id, data_edicao').order('data_edicao', { ascending: false });
    const ultimas = {}; 
    if(eds) eds.forEach(e => { if(!ultimas[e.batalha_id]) ultimas[e.batalha_id] = new Date(e.data_edicao).getTime(); });
    
    Object.keys(mapaBatalhas).sort((a,b) => (ultimas[b]||0) - (ultimas[a]||0)).forEach((id, i) => {
        const h = `<div class="item-batalha-lateral" onclick="escolherEdicao('${id}')"><img src="img/bat${id}.png" onerror="this.src='img/default_bat.png'"><span>${mapaBatalhas[id].nome}</span></div>`;
        if (i < 5) L.innerHTML += h; else R.innerHTML += h;
    });
}
document.addEventListener('DOMContentLoaded', gerarRanking);