const SB_URL = "https://izeayydapmwtnevkzfhm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZWF5eWRhcG13dG5ldmt6ZmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE1NDUsImV4cCI6MjA4NTAxNzU0NX0.wSkyGzqFny606kpwvrg47-sZFP4v_62ozW2Np8EG90A";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

const mapaBatalhas = {
    "001": { nome: "SANGUE NA 7" }, "002": { nome: "NOVA ERA" }, "003": { nome: "COALIZÃO" },
    "004": { nome: "PICO" }, "005": { nome: "BENÇA" }, "006": { nome: "EDUCA" },
    "007": { nome: "ZN" }, "008": { nome: "BLACK" }, "009": { nome: "MKT" }
};

// Formatação de data sem erro de fuso horário
function formatarDataBR(dataStr) {
    if (!dataStr) return "";
    const partes = dataStr.split('T')[0].split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function getFotoUrl(nome) {
    if (!nome || nome === '-' || nome === 'VAGO') return 'img/mc_default.png';
    const slug = nome.toLowerCase().trim().replace(/\s+/g, '_');
    return `img/${slug}.png`;
}

async function gerarRanking() {
    try {
        // Busca o ranking consolidado e todas as edições para cruzar os títulos
        const { data: ordenado, error } = await supabaseClient.from('ranking_geral').select('*');
        const { data: edicoes } = await supabaseClient.from('edicoes').select('campeao, batalha_id').order('data_edicao', { ascending: false });

        if (error) throw error;

        const corpo = document.getElementById('corpo-ranking');
        if (corpo && ordenado) {
            corpo.innerHTML = ordenado.map((item, i) => {
                
                let badgeHtml = "";
                if (item.total_folhinhas > 0) {
                    // Filtra todas as batalhas onde esse MC foi campeão
                    const vitoriasDoMC = edicoes?.filter(ed => 
                        ed.campeao && ed.campeao.toUpperCase().includes(item.mc_nome.toUpperCase())
                    ) || [];

                    // Gera o HTML de cada logo (com efeito de sobreposição)
                    const logosHtml = vitoriasDoMC.map((vitoria, idx) => `
                        <img src="img/bat${vitoria.batalha_id}.png" 
                             onerror="this.src='img/bat002.png'" 
                             title="${mapaBatalhas[vitoria.batalha_id]?.nome || 'Campeão'}"
                             style="width:30px; height:30px; border-radius:50%; border:2px solid var(--primary); 
                                    object-fit:cover; background:#000; margin-right:-10px; position:relative; 
                                    z-index:${10 - idx}; box-shadow: 2px 0 5px rgba(0,0,0,0.5);">
                    `).join('');

                    badgeHtml = `
                        <div style="display:flex; align-items:center; margin-top:8px; padding-left:5px;">
                            ${logosHtml}
                            ${item.total_folhinhas > vitoriasDoMC.length ? 
                                `<span style="margin-left:15px; font-size:0.7rem; color:#888;">+${item.total_folhinhas - vitoriasDoMC.length}</span>` : ''}
                        </div>
                    `;
                }

                return `
                <tr>
                    <td style="color:var(--primary); font-weight:bold;">${i+1}º</td>
                    <td align="left">
                        <div style="display:flex; align-items:center">
                            <img src="${getFotoUrl(item.mc_nome)}" class="foto-mc" onerror="this.src='img/mc_default.png'">
                            <div style="margin-left:12px; display:flex; flex-direction:column; align-items:flex-start;">
                                <span class="mc-name" style="line-height:1.2; font-size:1.1rem;">${item.mc_nome}</span>
                                ${badgeHtml}
                            </div>
                        </div>
                    </td>
                    <td style="font-weight:bold; font-size:1.1rem;">${item.total_pontos}</td>
                    <td style="color:#888;">${item.total_twolalas}</td>
                    <td style="font-weight:bold;">${item.total_folhinhas || 0}</td>
                </tr>`;
            }).join('');
        }
        gerarStories();
    } catch (e) { console.error(e); }
}

async function gerarStories() {
    const L = document.getElementById('lista-left'), R = document.getElementById('lista-right');
    if(!L || !R) return;
    L.innerHTML = ""; R.innerHTML = "";
    try {
        const { data: eds } = await supabaseClient.from('edicoes').select('batalha_id, data_edicao').order('data_edicao', { ascending: false });
        const ultimas = {};
        if(eds) {
            eds.forEach(e => { 
                if(!ultimas[e.batalha_id]) {
                    ultimas[e.batalha_id] = new Date(e.data_edicao.replace(/-/g, '/')).getTime(); 
                }
            });
        }
        const ids = Object.keys(mapaBatalhas).sort((a,b) => (ultimas[b]||0) - (ultimas[a]||0));
        ids.forEach((id, i) => {
            const h = `<div class="item-batalha-lateral" onclick="escolherEdicao('${id}')"><img src="img/bat${id}.png" onerror="this.src='img/cbfl.png'"><span>${mapaBatalhas[id].nome}</span></div>`;
            if (i < 5) L.innerHTML += h; else R.innerHTML += h;
        });
    } catch (e) { console.error(e); }
}

async function escolherEdicao(idBat) {
    const { data: eds } = await supabaseClient.from('edicoes').select('id, data_edicao').eq('batalha_id', idBat).order('data_edicao',{ascending:false});
    if(!eds?.length) return alert("Sem edições.");
    const m = document.createElement('div'); m.className='modal-bracket';
    m.innerHTML = `
        <span class="close" onclick="this.parentElement.remove()">&times;</span>
        <div class="modal-content" style="max-width:400px;margin:auto;">
            <h3 style="color:var(--primary);text-align:center;font-family:'Black Ops One';">EDIÇÕES</h3>
            ${eds.map(ed => `
                <button onclick="this.parentElement.parentElement.remove();abrirBracket('${ed.id}',true)" class="btn-data">
                    ${formatarDataBR(ed.data_edicao)}
                </button>
            `).join('')}
        </div>`;
    document.body.appendChild(m);
}

async function abrirBracket(id, ehId=false) {
    let q = supabaseClient.from('edicoes').select('*');
    if(ehId) q=q.eq('id',id); else q=q.eq('batalha_id',id).order('data_edicao',{ascending:false}).limit(1);
    const {data} = await q; if(!data || !data.length) return;
    const ed=data[0], b=ed.bracket_json, p=ed.placares_json, camp=(ed.campeao||"-").toUpperCase();

    const renderF = (lista, pre, tit) => {
        if(!lista?.length) return "";
        let h = `<div class="v-round"><h4>${tit}</h4>`;
        for(let i=0; i<lista.length; i+=2) {
            h += `
                <div class="matchup">
                    <div class="v-mc-card">
                        <div><img src="${getFotoUrl(lista[i])}" class="v-foto-mini" onerror="this.src='img/mc_default.png'"><span class="v-nome">${lista[i]}</span></div>
                        <span class="v-placar">${p[pre+'_'+i]||0}</span>
                    </div>
                    <div class="v-mc-card">
                        <div><img src="${getFotoUrl(lista[i+1])}" class="v-foto-mini" onerror="this.src='img/mc_default.png'"><span class="v-nome">${lista[i+1]}</span></div>
                        <span class="v-placar">${p[pre+'_'+(i+1)]||0}</span>
                    </div>
                </div>`;
        }
        return h + `</div>`;
    };

    const m = document.createElement('div'); m.className='modal-bracket';
    m.innerHTML = `
        <span class="close" onclick="this.parentElement.remove()">&times;</span>
        <div class="modal-content">
            <div style="text-align:center; margin-bottom:15px;">
                <h2 style="color:var(--primary);margin:0;font-family:'Black Ops One';">${mapaBatalhas[ed.batalha_id].nome}</h2>
                <small style="color:#888;">${formatarDataBR(ed.data_edicao)}</small>
            </div>
            <div class="bracket-view">
                ${renderF(b.oitavas,'oit','OITAVAS')}
                ${renderF(b.quartas,'qua','QUARTAS')}
                ${renderF(b.semi,'sem','SEMI')}
                ${renderF(b.final,'fin','FINAL')}
                <div class="v-round">
                    <h4>🏆 CAMPEÃO</h4>
                    <div class="v-mc-card" style="border-color:var(--primary); background: rgba(255,69,0,0.1);">
                        <div>
                            <img src="${getFotoUrl(camp)}" class="v-foto-mini" onerror="this.src='img/mc_default.png'">
                            <span class="v-nome" style="color:var(--primary); font-weight:bold;">${camp}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(m);
}

document.addEventListener('DOMContentLoaded', gerarRanking);
