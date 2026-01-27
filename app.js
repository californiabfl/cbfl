/**
 * CBFL - Motor do Ranking 3.0 (Blindado contra Maiúsculas/Minúsculas)
 */

const SB_URL = "https://izeayydapmwtnevkzfhm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZWF5eWRhcG13dG5ldmt6ZmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDE1NDUsImV4cCI6MjA4NTAxNzU0NX0.wSkyGzqFny606kpwvrg47-sZFP4v_62ozW2Np8EG90A";

// No dicionário, os caminhos das logos estão em MINÚSCULO
const infoBatalhas = {
    "001": { nome: "Sangue na 7", logo: "img/bat001.png" },
    "002": { nome: "Batalha Nova Era", logo: "img/bat002.png" },
    "003": { nome: "Coalizão 016", logo: "img/bat003.png" },
    "004": { nome: "Batalha do Pico", logo: "img/bat004.png" },
    "005": { nome: "Batalha do Bença", logo: "img/bat005.png" },
    "006": { nome: "Batalha do Educa", logo: "img/bat006.png" },
    "007": { nome: "Batalha da ZN", logo: "img/bat007.png" },
    "008": { nome: "Batalha UBS", logo: "img/bat008.png" }
};

async function gerarRanking() {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/participacoes?select=*`, {
            headers: {
                "apikey": SB_KEY,
                "Authorization": `Bearer ${SB_KEY}`
            }
        });
        const participacoesReal = await response.json();

        const rankingMap = {};

        participacoesReal.forEach(p => {
            const mc = p.mc_nome;
            if (!rankingMap[mc]) {
                rankingMap[mc] = { 
                    nome: mc, totalPontos: 0, totalTwolalas: 0, totalFolhinhas: 0, conquistas: {} 
                };
            }
            
            rankingMap[mc].totalPontos += p.pontos;
            rankingMap[mc].totalTwolalas += (p.twolalas || 0);
            rankingMap[mc].totalFolhinhas += (p.folhinhas || 0);

            if (p.vitoria) {
                rankingMap[mc].conquistas[p.batalha_id] = (rankingMap[mc].conquistas[p.batalha_id] || 0) + 1;
            }
        });

        const ordenado = Object.values(rankingMap).sort((a, b) => b.totalPontos - a.totalPontos);
        renderizar(ordenado);
    } catch (error) {
        console.error("Erro ao carregar ranking:", error);
    }
}

function renderizar(dados) {
    const corpo = document.getElementById('corpo-ranking');
    if(!corpo) return;
    corpo.innerHTML = "";

    dados.forEach((item, index) => {
        let conquistasHtml = "";
        for (let batId in item.conquistas) {
            // Garante que a logo da batalha seja buscada em minúsculo
            const logoPath = infoBatalhas[batId].logo.toLowerCase();
            conquistasHtml += `
                <div class="selo-batalha" title="Ganhou ${item.conquistas[batId]}x">
                    <img src="${logoPath}">
                    <span class="selo-count">${item.conquistas[batId]}x</span>
                </div>`;
        }

        // A MÁGICA ESTÁ AQUI:
        // .toLowerCase() transforma "P.A" em "p.a" e "Mineirim" em "mineirim"
        // Assim, o código sempre vai procurar o arquivo em minúsculo na pasta img/
        const nomeParaArquivo = item.nome.toLowerCase();
        const fotoUrl = `img/${nomeParaArquivo}.png`;

        corpo.innerHTML += `
            <tr>
                <td style="font-size: 1.5rem; font-weight: bold;">${index + 1}º</td>
                <td class="nome-mc">
                    <div class="foto-container">
                        <img src="${fotoUrl}" class="foto-mc" onerror="this.src='img/mc_default.png'">
                    </div>
                    <div style="display:inline-block; vertical-align:middle;">
                        <span class="mc-name">${item.nome}</span>
                        <div class="conquistas-wrapper">${conquistasHtml}</div>
                    </div>
                </td>
                <td><span class="pts-badge">${item.totalPontos} pts</span></td>
                <td class="stat-val">${item.totalTwolalas}</td>
                <td class="stat-val">${item.totalFolhinhas}</td>
            </tr>`;
    });
}

document.addEventListener('DOMContentLoaded', gerarRanking);