const SB_URL = "https://izeayydapmwtnevkzfhm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZWF5eWRhcG13dG5ldmt6ZmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE1NDUsImV4cCI6MjA4NTAxNzU0NX0.wSkyGzqFny606kpwvrg47-sZFP4v_62ozW2Np8EG90A";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

function montarFormularioAdmin() {
    const container = document.getElementById('form-dinamico');
    const qtdMcs = document.getElementById('qtd_mcs').value;
    if (!container) return;
    container.innerHTML = "";

    const fases = [];
    if (qtdMcs === "16") fases.push({ id: 'oit', nome: 'Oitavas (1pt)', duelos: 8 });
    fases.push({ id: 'qua', nome: 'Quartas (1pt se 8mcs / 2pt se 16mcs)', duelos: 4 });
    fases.push({ id: 'sem', nome: 'Semifinais (5pts)', duelos: 2 });
    fases.push({ id: 'fin', nome: 'Grande Final (7pts)', duelos: 1 });

    fases.forEach(fase => {
        let html = `<div class="fase-section"><span class="fase-title">${fase.nome}</span><div class="duelos-grid">`;
        for (let i = 0; i < fase.duelos; i++) {
            const idx1 = i * 2, idx2 = i * 2 + 1;
            html += `<div class="duelo-card">
                <div class="input-row"><input type="text" id="${fase.id}_n_${idx1}" placeholder="MC 1"><input type="number" id="${fase.id}_p_${idx1}" value="0"></div>
                <div class="input-row"><input type="text" id="${fase.id}_n_${idx2}" placeholder="MC 2"><input type="number" id="${fase.id}_p_${idx2}" value="0"></div>
            </div>`;
        }
        container.innerHTML += html + `</div></div>`;
    });
}

async function salvarTudo() {
    const bId = document.getElementById('batalha_id').value;
    const dataE = document.getElementById('data_edicao').value;
    const camp = (document.getElementById('campeao_final').value || "").toUpperCase().trim();
    const qtd = document.getElementById('qtd_mcs').value;

    if (!dataE || !camp) return alert("⚠️ Preencha DATA e CAMPEÃO!");

    const bracket = { oitavas: [], quartas: [], semi: [], final: [], campeao: camp };
    const placares = {};
    const mcsPontos = {}; 

    const configs = [
        { id: 'oit', key: 'oitavas', n: 16 },
        { id: 'qua', key: 'quartas', n: 8 },
        { id: 'sem', key: 'semi', n: 4 },
        { id: 'fin', key: 'final', n: 2 }
    ];

    configs.forEach(f => {
        if (qtd === "8" && f.id === "oit") { bracket.oitavas = Array(16).fill("-"); return; }
        for (let i = 0; i < f.n; i++) {
            const nVal = (document.getElementById(`${f.id}_n_${i}`).value || "-").toUpperCase().trim();
            bracket[f.key].push(nVal);
            placares[`${f.id}_${i}`] = document.getElementById(`${f.id}_p_${i}`).value || "0";

            if (nVal !== "-" && nVal !== "" && nVal !== "VAGO") {
                let pts = 0;
                if (f.id === 'oit') pts = 1;
                if (f.id === 'qua') pts = (qtd === "8") ? 1 : 2;
                if (f.id === 'sem') pts = 5;
                if (f.id === 'fin') pts = 7;
                if (!mcsPontos[nVal] || pts > mcsPontos[nVal]) mcsPontos[nVal] = pts;
            }
        }
    });

    mcsPontos[camp] = 10;

    try {
        await supabaseClient.from('edicoes').insert([{ batalha_id: bId, data_edicao: dataE, bracket_json: bracket, placares_json: placares, campeao: camp }]);
        const listaFinal = Object.keys(mcsPontos).map(nome => ({
            batalha_id: bId, mc_nome: nome, pontos: mcsPontos[nome], vitoria: (nome === camp)
        }));
        await supabaseClient.from('participacoes').insert(listaFinal);
        alert("🚀 Publicado com Sucesso!");
        window.location.reload();
    } catch (err) { alert("Erro: " + err.message); }
}
document.addEventListener('DOMContentLoaded', montarFormularioAdmin);