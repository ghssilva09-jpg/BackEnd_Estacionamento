// const express = require("express");
import express from "express";
const app = express();
const PORT = 3000;

app.use(express.json());

const CAPACIDADE = 20;
const PRECO_PRIMEIRA_HORA = 10;
const PRECO_HORA_ADICIONAL = 5;

let proximoID = 1;
let VEICULOS = [];
let HISTORICO = [];
//ROTA INICIAL
app.get("/",(req, res)=>{
    res.status(200).json({msg: "API funcionando"});
});
//CADASTRAR ENTRADA
app.post("/veiculos",(req, res)=>{
    const {placa, modelo, cor} = req.body;

    if(![placa, modelo, cor].every(
        (campo) => typeof campo === "string" && campo.trim()
    )){
        return res.status(400).json({
            msg: "Informe a placa, modelo e cor válido"
        })
    }

    const placaNormalizada = placa.trim().toUpperCase();

    if(VEICULOS.length >= CAPACIDADE){
        return res.status(409).json({
            msg: "Estacionamento lotado."
        });
    }

    if(VEICULOS.some((v) => v.placa === placaNormalizada)){
        return res.status(409).json({
            msg: "Veículo já estacionado."
        });
    }

    const veiculo = {
        id : proximoID++,
        placa: placaNormalizada,
        modelo : modelo.trim(),
        cor: cor.trim(),
        entrada: new Date().toISOString()
    };

    VEICULOS.push(veiculo);

    return res.status(201).json({msg: "Entrada registrada", veiculo});
});

// LISTAR VEÍCULOS
app.get("/veiculos",(req,res)=>{
    res.status(200).json({total: VEICULOS.length, VEICULOS});
});
//CONSULTA VEÍCULO
app.get("/veiculos/:id", (req,res)=>{
    const id = Number(req.params.id);
    const veiculo = VEICULOS.find((v) => v.id === id);

    if(!veiculo) return res.status(404).json({msg: "Veículo não encontrado"});
   
    return res.json(veiculo);
});
//CONSULTA AS VAGAS
app.get("/vagas", (req,res) =>{
    res.status(200).json({
        capacidade: CAPACIDADE,
        ocupadas: VEICULOS.length,
        disponiveis: CAPACIDADE - VEICULOS.length
    });
});
//CALCULAR
function calcularValor(entrada, saida = new Date()){
    const inicio = new Date(entrada);
    const tempoMs = saida.getTime() - inicio.getTime();
    const horas = Math.max(1, Math.ceil(tempoMs / (1000 * 60 * 60)));
    const valor = PRECO_PRIMEIRA_HORA + (horas -1 ) * PRECO_HORA_ADICIONAL;
    return {horasCobradas: horas, valor};
}
//CONSULTA VALOR
app.get("/veiculos/:id/valor", (req, res)=>{
    const veiculo = VEICULOS.find((v) => v.id === Number(req.params.id));
    if(!veiculo) return res.status(404).json({msg: "Veículo não encontrado"});

    return res.json({
        placa : veiculo.placa,
        entrada : veiculo.entrada,
        ...calcularValor(veiculo.entrada)
    });
    
});
// REGISTRA SAIDA
app.post("/veiculos/:id/saida", (req, res)=>{
    const indice =  VEICULOS.find(v => v.id === Number(req.params.id));
    if(indice === -1) return res.status(404).json({msg: "veiculo não encontrado"});

    const veiculo = VEICULOS[indice];  
    const saida = new Date();
    const calculo = calcularValor(vaiculo.entrada, saida);

    const registro = {
        ...veiculo,
        saida: saida.toISOString(),
        horasCobradas: calculo.horasCobradas,
        valorPago: calculo.valor
    };
    HISTORICO.push(registro);
    VEICULOS.splice(indice, 1);

    res.status(200).json({
        mdg: "Saida registrada", registro
    })

});
//ATUALIZA O VAÍCULO
app.put("/veiculos/:id", (req, res)=>{
    const veiculo = VEICULOS.find((v)=> v.id === Number(req.params.id));
    if(!veiculo) return res.status(400).jason({msg: "veiculo não encontrado"});
    

    const {placa, modelo, cor} = req.body;


    if(![placa, modelo, cor].every(
        (campo) => campo === "string" && campo.trim()
    )){
        return res.status(400).json({erro: "informe placa, modelo e cor válidos"})
    }

    const novaPlaca = placa.trim().toUpperCase();

    if(VEICULOS.some((v) => v.placa === novaPlaca && v.id !== novaPlaca)){
        res.status(400).json({erro: "placa ja cadastrada"})
    }

    veiculo.placa = novaPlaca;
    veiculo.modelo = modelo.trim();
    veiculo.cor = cor.trim();

    return res.status(200).json({msg: "vaículo atualizado"})
});
// HISTORICO
app.get("/histrorico", (req, res)=>{
    res.json({total: HISTORICO.length,HISTORICO});
});
//RELATÓRIO
app.get("/faturamento", (req,res)=>{
    const faturamento = HISTORICO.reduce(
        (total, item) => total + item.valorPago, 0
    );

    res.jason({
        veiculosEstacionados : VEICULOS.length,
        vagasDisponiveis: CAPACIDADE - VEICULOS.length,
        saidaRealizadas: HISTORICO.length,
        faturamento: Number(faturamento.toFixed(2))
    })
});

// É O QUE INICIA O SERVIDOR
app.listen(PORT,()=>{
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});