import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import apiHandler from "./api/index.js";

const app=express();
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
app.use(express.json({limit:"2mb"}));
app.use(express.static(__dirname));
function wrap(route){return (req,res)=>{req.url=`/api/index?route=${route}`;return apiHandler(req,res)}}
for (const r of ["config","auth-check","health"]) app.get(`/api/${r}`, wrap(r));
for (const r of ["google-login","logout","chat"]) app.post(`/api/${r}`, wrap(r));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`LIA V5.3 running on port ${PORT}`));
