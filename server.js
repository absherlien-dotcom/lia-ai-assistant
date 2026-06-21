import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import apiHandler from "./api/index.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json({limit:"2mb"}));
app.use(express.static(__dirname));

function wrap(route){return (req,res)=>{req.url=`/api/index?route=${route}`; return apiHandler(req,res)}}
app.post("/api/login",wrap("login"));
app.post("/api/logout",wrap("logout"));
app.get("/api/auth-check",wrap("auth-check"));
app.get("/api/health",wrap("health"));
app.get("/api/env-check",wrap("env-check"));
app.post("/api/chat",wrap("chat"));
app.post("/login",wrap("login"));
app.post("/logout",wrap("logout"));
app.get("/auth-check",wrap("auth-check"));
app.get("/health",wrap("health"));
app.get("/env-check",wrap("env-check"));
app.post("/chat",wrap("chat"));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`LIA V5 running on port ${PORT}`));
