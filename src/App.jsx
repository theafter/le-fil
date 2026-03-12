import { useState, useRef, useEffect } from "react";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const T = {
  blue:      "#1A73E8",
  blueLight: "#E8F0FE",
  blueMid:   "#AECBFA",
  red:       "#EA4335",
  redLight:  "#FCE8E6",
  black:     "#202124",
  gray1:     "#F8F9FA",
  gray2:     "#F1F3F4",
  gray3:     "#E8EAED",
  gray4:     "#9AA0A6",
  gray5:     "#5F6368",
  white:     "#FFFFFF",
  sh:        "rgba(60,64,67,0.10)",
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es "Fil", un assistant numérique bienveillant pour les personnes âgées.

RÈGLES DE COMMUNICATION :
- Français simple, chaleureux, rassurant. Jamais de jargon.
- "appuyer" (pas "cliquer"), "écran" (pas "interface"), "programme" (pas "application")
- Phrases courtes, max 15 mots. Instructions numérotées, une action à la fois.
- Toujours encourager, jamais juger. Maximum 120 mots dans "message".

FORMAT OBLIGATOIRE — JSON pur, sans markdown :

Sans visuel : { "message": "Ta réponse.", "visual": null }

Avec visuel :
{
  "message": "Ta réponse courte.",
  "visual": {
    "title": "Titre court",
    "steps": [
      { "num": 1, "icon": "👆", "title": "Action", "desc": "10 mots max", "screen": "home", "zone": "bottom-left" }
    ]
  }
}

════════════════════════════════════════
RÈGLE ABSOLUE : chaque étape a un "screen" ET un "zone".
Le "screen" détermine CE QUI EST AFFICHÉ sur le téléphone.
Le "zone" détermine OÙ apparaît le cercle orange de surlignage.
Ils doivent être COHÉRENTS — le cercle doit pointer vers quelque chose visible sur l'écran affiché.
════════════════════════════════════════

LISTE COMPLÈTE DES SCREENS ET CE QU'ILS MONTRENT :
- "home"             → écran d'accueil avec grille d'icônes et dock en bas
- "messages-list"    → liste des conversations SMS/iMessage
- "messages-compose" → conversation ouverte avec clavier visible
- "photo-gallery"    → grille de photos
- "camera"           → viseur appareil photo avec bouton rond blanc en bas au centre
- "video-call"       → appel vidéo en cours
- "browser"          → navigateur Google avec barre de recherche en haut et clavier visible
- "settings"         → menu des réglages (liste : Wi-Fi, Notifications, Sons, Luminosité…)
- "volume-bar"       → écran d'accueil + curseur de volume vertical à droite
- "wifi-settings"    → liste des réseaux Wi-Fi disponibles

ZONES VALIDES PAR SCREEN (utilise UNIQUEMENT ces combinaisons) :

screen "home" →
  "bottom-left"   = icône Messages dans le dock
  "bottom-right"  = icône Appareil photo ou Internet dans le dock
  "bottom-center" = icône Téléphone dans le dock
  "center"        = grille d'applications au milieu
  "top-bar"       = barre de statut en haut (heure, batterie)
  "side-button"   = bouton volume physique sur le côté droit du téléphone
  "notification"  = notification en bandeau en haut

screen "messages-list" →
  "top-right"     = bouton crayon pour écrire un nouveau message
  "center"        = liste des conversations
  "top-left"      = bouton retour

screen "messages-compose" →
  "center"        = zone de saisie du message / contenu de la conversation
  "bottom-right"  = bouton envoyer (flèche vers le haut, en bas à droite)
  "keyboard"      = clavier en bas de l'écran
  "top-left"      = bouton retour vers la liste

screen "photo-gallery" →
  "center"        = grille de photos
  "full-screen"   = tout l'écran

screen "camera" →
  "bottom-center" = grand bouton blanc rond pour prendre la photo
  "center"        = viseur / zone de mise au point
  "top-right"     = bouton retourner la caméra

screen "video-call" →
  "center"        = zone vidéo principale
  "bottom-center" = boutons de contrôle (muet, caméra, raccrocher)

screen "browser" →
  "search-bar"    = barre d'adresse / recherche en haut
  "keyboard"      = clavier en bas pour taper
  "center"        = contenu de la page

screen "settings" →
  "center"        = liste des réglages
  "top-bar"       = titre "Réglages" en haut

screen "volume-bar" →
  "center"        = curseur de volume vertical (à droite de l'écran)
  "side-button"   = bouton physique volume sur le côté du téléphone

screen "wifi-settings" →
  "center"        = liste des réseaux disponibles
  "top-right"     = toggle Wi-Fi on/off

════════════════════════════════════════
SÉQUENCES TYPES À RESPECTER EXACTEMENT :

Envoyer un SMS :
  1. screen:"home",          zone:"bottom-left"   → trouver Messages dans le dock
  2. screen:"messages-list", zone:"top-right"     → appuyer sur le crayon pour écrire
  3. screen:"messages-compose", zone:"center"     → taper le message
  4. screen:"messages-compose", zone:"bottom-right" → appuyer sur Envoyer

Monter le volume :
  1. screen:"home",       zone:"side-button" → boutons volume sur le côté droit
  2. screen:"volume-bar", zone:"center"      → curseur de volume apparu

Prendre une photo :
  1. screen:"home",   zone:"bottom-right"   → icône Appareil photo dans le dock
  2. screen:"camera", zone:"bottom-center"  → appuyer sur le grand bouton blanc

Chercher sur internet :
  1. screen:"home",    zone:"bottom-right" → icône Internet dans le dock
  2. screen:"browser", zone:"search-bar"  → barre de recherche en haut
  3. screen:"browser", zone:"keyboard"    → taper sa recherche

Réglages Wi-Fi :
  1. screen:"home",          zone:"center"        → icône Réglages dans les apps
  2. screen:"settings",      zone:"center"        → appuyer sur Wi-Fi dans la liste
  3. screen:"wifi-settings", zone:"center"        → choisir son réseau

Appel vidéo :
  1. screen:"home",       zone:"bottom-left"   → icône Téléphone dans le dock
  2. screen:"video-call", zone:"center"        → écran d'appel vidéo
  3. screen:"video-call", zone:"bottom-center" → boutons de contrôle

Voir les photos :
  1. screen:"home",          zone:"bottom-right" → icône Photos dans le dock
  2. screen:"photo-gallery", zone:"center"       → grille de photos
════════════════════════════════════════

Inclure "visual" quand la question porte sur : messagerie, appels, photos, réglages, internet, wifi, volume, batterie, navigateur.`;

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
const QUICK = [
  { emoji:"✉️",  label:"Envoyer un message",  prompt:"Comment envoyer un message à quelqu'un ?" },
  { emoji:"🖼️", label:"Voir mes photos",      prompt:"Comment voir mes photos sur mon téléphone ?" },
  { emoji:"📞", label:"Appel vidéo",           prompt:"Comment appeler quelqu'un en vidéo ?" },
  { emoji:"🔍", label:"Chercher sur internet", prompt:"Comment chercher quelque chose sur internet ?" },
  { emoji:"🔋", label:"Batterie",              prompt:"Ma batterie se vide trop vite, que faire ?" },
  { emoji:"🔊", label:"Monter le son",         prompt:"Comment monter le son de mon téléphone ?" },
];

// ─── ZONE MAP ─────────────────────────────────────────────────────────────────
const ZONE_MAP = {
  "top-bar":       { top:"3%",    left:"4%",   width:"92%", height:"12%" },
  "top-right":     { top:"7%",    right:"3%",  width:"28%", height:"14%" },
  "top-left":      { top:"7%",    left:"3%",   width:"28%", height:"14%" },
  "center":        { top:"28%",   left:"8%",   width:"84%", height:"36%" },
  "full-screen":   { top:"4%",    left:"2%",   width:"96%", height:"90%" },
  "bottom-center": { bottom:"12%",left:"22%",  width:"56%", height:"17%" },
  "bottom-left":   { bottom:"12%",left:"3%",   width:"38%", height:"17%" },
  "bottom-right":  { bottom:"12%",right:"3%",  width:"38%", height:"17%" },
  "keyboard":      { bottom:"1%", left:"2%",   width:"96%", height:"38%" },
  "notification":  { top:"9%",    left:"3%",   width:"94%", height:"14%" },
  "side-button":   { top:"27%",   right:"-8%", width:"18%", height:"16%", borderRadius:"0 8px 8px 0" },
  "search-bar":    { top:"7%",    left:"3%",   width:"94%", height:"13%" },
};

// ─── PHONE SCREENS ────────────────────────────────────────────────────────────
function ScreenHome() {
  const apps = [
    ["📱","Téléphone","#1A73E8"],["✉️","Messages","#EA4335"],["🖼️","Photos","#34A853"],["🌐","Internet","#FBBC04"],
    ["📧","Email","#EA4335"],["🎵","Musique","#FF6D00"],["🗓","Agenda","#1A73E8"],["📍","Plans","#34A853"],
    ["⚙️","Réglages","#9AA0A6"],["🔍","Chercher","#1A73E8"],["👤","Contacts","#34A853"],["📰","Actus","#EA4335"],
  ];
  return (
    <div style={{ height:"100%",background:"#1C1B1F",display:"flex",flexDirection:"column" }}>
      <div style={{ flex:1,padding:"8px 7px 4px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,alignContent:"start" }}>
        {apps.map(([ico,lbl,col],i)=>(
          <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
            <div style={{ width:32,height:32,borderRadius:10,background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>{ico}</div>
            <span style={{ fontSize:7,color:"rgba(255,255,255,0.85)",textAlign:"center",lineHeight:1.2 }}>{lbl}</span>
          </div>
        ))}
      </div>
      <div style={{ margin:"0 8px 8px",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(12px)",borderRadius:18,padding:"6px 10px",display:"flex",justifyContent:"space-around" }}>
        {[["📞","#1A73E8"],["✉️","#EA4335"],["🖼️","#34A853"],["🌐","#FBBC04"]].map(([ico,col],i)=>(
          <div key={i} style={{ width:28,height:28,borderRadius:10,background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>{ico}</div>
        ))}
      </div>
    </div>
  );
}

function ScreenMessagesList() {
  const rows=[
    {n:"Marie",m:"D'accord, à demain !",t:"10:32",u:2,c:"#EA4335"},
    {n:"Paul",m:"Tu as vu le programme ?",t:"Hier",u:0,c:"#1A73E8"},
    {n:"Famille",m:"Dimanche chez maman",t:"Lun",u:5,c:"#34A853"},
    {n:"Médecin",m:"Votre RDV est confirmé",t:"Lun",u:0,c:"#FBBC04"},
  ];
  return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",background:"#fff" }}>
      <div style={{ padding:"6px 8px 5px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.gray3}` }}>
        <span style={{ fontSize:11,fontWeight:700,color:T.black }}>Messages</span>
        <div style={{ width:22,height:22,borderRadius:"50%",background:T.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff" }}>✏</div>
      </div>
      {rows.map((r,i)=>(
        <div key={i} style={{ display:"flex",gap:7,padding:"6px 8px",borderBottom:`1px solid ${T.gray3}`,alignItems:"center" }}>
          <div style={{ width:26,height:26,borderRadius:"50%",background:r.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700,flexShrink:0 }}>{r.n[0]}</div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:9,fontWeight:700,color:T.black }}>{r.n}</span>
              <span style={{ fontSize:7.5,color:T.gray4 }}>{r.t}</span>
            </div>
            <span style={{ fontSize:8,color:T.gray5,display:"block",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis" }}>{r.m}</span>
          </div>
          {r.u>0&&<div style={{ width:15,height:15,borderRadius:"50%",background:T.blue,color:"#fff",fontSize:7.5,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0 }}>{r.u}</div>}
        </div>
      ))}
    </div>
  );
}

const KB=[["A","Z","E","R","T","Y","U","I","O","P"],["Q","S","D","F","G","H","J","K","L"],["⇧","W","X","C","V","B","N","M","⌫"]];
function KbRow() {
  return (
    <div style={{ background:"#D1D5DB",padding:"3px 2px 2px" }}>
      {KB.map((row,ri)=>(
        <div key={ri} style={{ display:"flex",justifyContent:"center",gap:2,marginBottom:2 }}>
          {row.map((k,ki)=>(
            <div key={ki} style={{ minWidth:11,height:12,background:"#fff",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:T.black,boxShadow:"0 1px 0 rgba(0,0,0,0.25)",padding:"0 2px" }}>{k}</div>
          ))}
        </div>
      ))}
      <div style={{ display:"flex",gap:2,justifyContent:"center",marginTop:1 }}>
        <div style={{ width:24,height:12,background:"#B0B7C0",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:T.black }}>123</div>
        <div style={{ flex:1,maxWidth:66,height:12,background:"#fff",borderRadius:3 }}/>
        <div style={{ width:15,height:12,background:T.blue,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:"#fff" }}>↩</div>
      </div>
    </div>
  );
}

function ScreenMessagesCompose() {
  return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",background:"#fff" }}>
      <div style={{ padding:"4px 8px",display:"flex",alignItems:"center",gap:6,borderBottom:`1px solid ${T.gray3}` }}>
        <span style={{ fontSize:10,color:T.blue,fontWeight:700 }}>‹</span>
        <div style={{ width:20,height:20,borderRadius:"50%",background:T.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700 }}>M</div>
        <span style={{ fontSize:9,fontWeight:700,color:T.black }}>Marie</span>
      </div>
      <div style={{ flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",gap:5 }}>
        {[{me:false,t:"Bonjour ! Comment tu vas ?"},{me:true,t:"Bien merci ! Et toi ?"},{me:false,t:"Très bien 😊"}].map((m,i)=>(
          <div key={i} style={{ alignSelf:m.me?"flex-end":"flex-start",background:m.me?T.blue:T.gray2,borderRadius:m.me?"16px 16px 2px 16px":"16px 16px 16px 2px",padding:"4px 8px",maxWidth:"72%" }}>
            <span style={{ fontSize:7.5,color:m.me?"#fff":T.black }}>{m.t}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex",gap:4,padding:"3px 6px",alignItems:"center",borderTop:`1px solid ${T.gray3}` }}>
        <div style={{ flex:1,height:17,background:T.gray2,borderRadius:12 }}/>
        <div style={{ width:17,height:17,borderRadius:"50%",background:T.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff" }}>↑</div>
      </div>
      <KbRow/>
    </div>
  );
}

function ScreenPhotoGallery() {
  const em=["🌸","🏖️","🎂","🌄","👨‍👩‍👧","🐕","🌿","🎄","🦋","🌺","🏔️","☀️"];
  return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",background:"#fff" }}>
      <div style={{ padding:"4px 8px",fontWeight:700,fontSize:10,color:T.black,borderBottom:`1px solid ${T.gray3}` }}>Photos</div>
      <div style={{ flex:1,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2,padding:2 }}>
        {em.map((e,i)=><div key={i} style={{ aspectRatio:"1",background:T.gray2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{e}</div>)}
      </div>
    </div>
  );
}

function ScreenCamera() {
  return (
    <div style={{ height:"100%",background:"#111",display:"flex",flexDirection:"column",padding:"6px 5px 8px" }}>
      <div style={{ flex:1,background:"#1a1a1a",borderRadius:10,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
        <span style={{ fontSize:32,zIndex:1 }}>🌸</span>
        {[33,66].map(p=><div key={`v${p}`} style={{ position:"absolute",top:0,bottom:0,left:`${p}%`,width:1,background:"rgba(255,255,255,0.18)" }}/>)}
        {[33,66].map(p=><div key={`h${p}`} style={{ position:"absolute",left:0,right:0,top:`${p}%`,height:1,background:"rgba(255,255,255,0.18)" }}/>)}
        <div style={{ position:"absolute",width:28,height:28,border:`2px solid ${T.red}`,borderRadius:4,top:"34%",left:"41%" }}/>
      </div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-around",paddingTop:8 }}>
        <div style={{ width:22,height:22,borderRadius:6,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11 }}>🌸</div>
        <div style={{ width:38,height:38,borderRadius:"50%",background:"#fff",border:"3px solid rgba(255,255,255,0.4)" }}/>
        <div style={{ width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff" }}>↩</div>
      </div>
    </div>
  );
}

function ScreenVideoCall() {
  return (
    <div style={{ height:"100%",background:"#111",display:"flex",flexDirection:"column",padding:"7px 6px 10px" }}>
      <div style={{ flex:1,background:"linear-gradient(160deg,#1a2744,#0d1b38)",borderRadius:12,position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
        <div style={{ width:46,height:46,borderRadius:"50%",background:T.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#fff",fontWeight:700 }}>M</div>
        <span style={{ fontSize:8,color:"rgba(255,255,255,0.8)",marginTop:5,fontWeight:600 }}>Marie</span>
        <div style={{ position:"absolute",bottom:8,right:8,width:32,height:42,background:"rgba(255,255,255,0.1)",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>🧑</div>
        <div style={{ position:"absolute",top:8,left:8,background:"rgba(0,0,0,0.5)",borderRadius:6,padding:"2px 5px" }}>
          <span style={{ fontSize:7,color:"#fff" }}>12:34</span>
        </div>
      </div>
      <div style={{ display:"flex",gap:12,justifyContent:"center",paddingTop:8 }}>
        {[["🔇","rgba(255,255,255,0.15)"],["📷","rgba(255,255,255,0.15)"],["📵",T.red]].map(([ico,col],i)=>(
          <div key={i} style={{ width:32,height:32,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{ico}</div>
        ))}
      </div>
    </div>
  );
}

function ScreenBrowser() {
  return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",background:"#fff" }}>
      <div style={{ padding:"4px 5px",background:T.gray1,borderBottom:`1px solid ${T.gray3}` }}>
        <div style={{ background:"#fff",borderRadius:20,boxShadow:`0 1px 3px ${T.sh}`,padding:"3px 8px",display:"flex",alignItems:"center",gap:4 }}>
          <span style={{ fontSize:8 }}>🔒</span>
          <span style={{ fontSize:7.5,color:T.gray5,flex:1 }}>google.fr</span>
          <span style={{ fontSize:8 }}>↻</span>
        </div>
      </div>
      <div style={{ flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
        <div style={{ fontSize:20,fontWeight:700,padding:"4px 0",letterSpacing:-0.5 }}>
          <span style={{ color:"#4285F4" }}>G</span><span style={{ color:T.red }}>o</span><span style={{ color:"#FBBC04" }}>o</span><span style={{ color:"#4285F4" }}>g</span><span style={{ color:"#34A853" }}>l</span><span style={{ color:T.red }}>e</span>
        </div>
        <div style={{ width:"100%",background:"#fff",borderRadius:24,boxShadow:`0 1px 6px rgba(60,64,67,0.18)`,padding:"4px 9px",display:"flex",alignItems:"center",gap:4 }}>
          <span style={{ fontSize:9 }}>🔍</span>
          <span style={{ fontSize:7.5,color:T.gray4,flex:1 }}>Rechercher…</span>
          <span style={{ fontSize:9 }}>🎙</span>
        </div>
        {["Météo aujourd'hui","Actualités","Recettes faciles"].map((item,i)=>(
          <div key={i} style={{ width:"100%",fontSize:7.5,color:T.blue,padding:"3px 8px",background:T.gray2,borderRadius:8,display:"flex",gap:5,alignItems:"center" }}>🕐 {item}</div>
        ))}
      </div>
      <KbRow/>
    </div>
  );
}

function ScreenSettings() {
  const items=[{ico:"📶",col:T.blue,lbl:"Wi-Fi",val:"Connecté"},{ico:"🔔",col:T.red,lbl:"Notifications"},{ico:"🔊",col:"#FF6D00",lbl:"Sons"},{ico:"🔆",col:"#FBBC04",lbl:"Luminosité"},{ico:"🔋",col:"#34A853",lbl:"Batterie",val:"82%"},{ico:"📱",col:T.gray5,lbl:"Général"}];
  return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",background:"#fff" }}>
      <div style={{ padding:"4px 8px",fontWeight:700,fontSize:10,color:T.black,borderBottom:`1px solid ${T.gray3}` }}>Réglages</div>
      {items.map((item,i)=>(
        <div key={i} style={{ display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderBottom:`1px solid ${T.gray3}` }}>
          <div style={{ width:22,height:22,borderRadius:6,background:item.col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0 }}>{item.ico}</div>
          <span style={{ flex:1,fontSize:8.5,color:T.black }}>{item.lbl}</span>
          {item.val&&<span style={{ fontSize:8,color:T.gray4 }}>{item.val}</span>}
          <span style={{ fontSize:10,color:T.gray4 }}>›</span>
        </div>
      ))}
    </div>
  );
}

function ScreenVolumeBar() {
  return (
    <div style={{ height:"100%",position:"relative" }}>
      <ScreenHome/>
      <div style={{ position:"absolute",top:"20%",right:"8%",background:"rgba(30,30,30,0.9)",backdropFilter:"blur(12px)",borderRadius:20,padding:"10px 7px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,zIndex:10 }}>
        <span style={{ fontSize:11 }}>🔊</span>
        <div style={{ width:6,height:55,background:"rgba(255,255,255,0.2)",borderRadius:3,position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"68%",background:"#fff",borderRadius:3 }}/>
        </div>
        <span style={{ fontSize:11 }}>🔇</span>
      </div>
    </div>
  );
}

function ScreenWifi() {
  const nets=[{n:"Livebox-5A2F",b:4,ok:true},{n:"SFR_4892",b:3,ok:false},{n:"Freebox-C3A1",b:2,ok:false},{n:"AndroidAP",b:1,ok:false}];
  return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",background:"#fff" }}>
      <div style={{ padding:"4px 8px",fontWeight:700,fontSize:10,color:T.black,borderBottom:`1px solid ${T.gray3}` }}>Réglages › Wi-Fi</div>
      <div style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderBottom:`1px solid ${T.gray3}` }}>
        <span style={{ fontSize:8.5,flex:1 }}>Wi-Fi</span>
        <div style={{ width:26,height:14,borderRadius:7,background:T.blue,display:"flex",alignItems:"center",paddingLeft:13 }}>
          <div style={{ width:12,height:12,background:"#fff",borderRadius:"50%" }}/>
        </div>
      </div>
      {nets.map((n,i)=>(
        <div key={i} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 8px",borderBottom:`1px solid ${T.gray3}`,background:n.ok?T.blueLight:"transparent" }}>
          <span style={{ fontSize:7.5 }}>🔒</span>
          <span style={{ flex:1,fontSize:8,color:n.ok?T.blue:T.black,fontWeight:n.ok?700:400 }}>{n.n}</span>
          <span style={{ fontSize:8,color:T.gray4 }}>{"█".repeat(n.b)}</span>
          {n.ok&&<span style={{ fontSize:9,color:T.blue }}>✓</span>}
          <span style={{ fontSize:10,color:T.gray4 }}>›</span>
        </div>
      ))}
    </div>
  );
}

function PhoneScreen({ screenId }) {
  const map={
    "home":<ScreenHome/>,"messages-list":<ScreenMessagesList/>,"messages-compose":<ScreenMessagesCompose/>,
    "photo-gallery":<ScreenPhotoGallery/>,"camera":<ScreenCamera/>,"video-call":<ScreenVideoCall/>,
    "browser":<ScreenBrowser/>,"settings":<ScreenSettings/>,"volume-bar":<ScreenVolumeBar/>,"wifi-settings":<ScreenWifi/>,
  };
  return map[screenId]||<ScreenHome/>;
}

// ─── PHONE MOCKUP ─────────────────────────────────────────────────────────────
function PhoneMockup({ step }) {
  const stepScreen = step?.screen || "home";
  const stepZone   = step?.zone;

  const [screen, setScreen] = useState(stepScreen);
  const [zone,   setZone]   = useState(stepZone);
  const [fading, setFading] = useState(false);
  const prevScreen = useRef(stepScreen);

  useEffect(() => {
    if (stepScreen !== prevScreen.current) {
      setFading(true);
      setZone(null);
      const t = setTimeout(() => {
        setScreen(stepScreen);
        prevScreen.current = stepScreen;
        setFading(false);
        setZone(stepZone);
      }, 220);
      return () => clearTimeout(t);
    } else {
      setZone(stepZone);
    }
  }, [stepScreen, stepZone]);

  const hl=zone?ZONE_MAP[zone]:null;

  return (
    <div style={{ display:"flex",justifyContent:"center",padding:"0 8px" }}>
      <div style={{ width:150,height:282,background:"#18181B",borderRadius:28,border:"2.5px solid #27272A",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",position:"relative",overflow:"visible",flexShrink:0 }}>
        <div style={{ position:"absolute",top:"30%",right:-4,width:4,height:"13%",background:"#3F3F46",borderRadius:"0 3px 3px 0",zIndex:30 }}/>
        <div style={{ position:"absolute",top:"22%",left:-3,width:3,height:"6%",background:"#3F3F46",borderRadius:"3px 0 0 3px",zIndex:30 }}/>
        <div style={{ position:"absolute",top:"31%",left:-3,width:3,height:"8%",background:"#3F3F46",borderRadius:"3px 0 0 3px",zIndex:30 }}/>
        <div style={{ position:"absolute",top:"42%",left:-3,width:3,height:"8%",background:"#3F3F46",borderRadius:"3px 0 0 3px",zIndex:30 }}/>
        <div style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:50,height:18,background:"#18181B",borderRadius:"0 0 14px 14px",zIndex:10 }}/>
        <div style={{ position:"absolute",top:18,left:2.5,right:2.5,bottom:3,background:"#fff",borderRadius:"0 0 25px 25px",overflow:"hidden" }}>
          <div style={{ height:17,background:"#fff",borderBottom:`1px solid ${T.gray3}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px",fontSize:7.5,color:T.black,flexShrink:0 }}>
            <span style={{ fontWeight:700 }}>9:41</span>
            <span style={{ color:T.gray5 }}>▊▊▊ 🔋</span>
          </div>
          <div style={{ position:"relative",height:"calc(100% - 17px)",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,opacity:fading?0:1,transition:"opacity 0.22s ease" }}>
              <PhoneScreen screenId={screen}/>
            </div>
            {hl&&!fading&&(
              <div style={{ position:"absolute",...hl,border:`2px solid ${T.red}`,borderRadius:hl.borderRadius||10,background:`${T.red}1A`,animation:"pulseZone 1.5s ease-in-out infinite",zIndex:25,pointerEvents:"none" }}>
                <div style={{ position:"absolute",top:-7,left:"50%",transform:"translateX(-50%)",width:12,height:12,borderRadius:"50%",background:T.red,animation:"pulseDot 1.5s ease-in-out infinite",boxShadow:`0 0 8px ${T.red}99` }}/>
              </div>
            )}
          </div>
        </div>
        <div style={{ position:"absolute",bottom:5,left:"50%",transform:"translateX(-50%)",width:40,height:3,background:"rgba(255,255,255,0.2)",borderRadius:2,zIndex:5 }}/>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ visual, onClose, isMobile }) {
  const [active,setActive]=useState(0);
  useEffect(()=>setActive(0),[visual]);
  if(!visual) return null;
  const step=visual.steps?.[active];

  if(isMobile) return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(32,33,36,0.32)",zIndex:99,animation:"fadeIn 0.2s ease" }}/>
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:T.white,borderRadius:"24px 24px 0 0",zIndex:100,animation:"slideUp 0.35s cubic-bezier(0.22,1,0.36,1)",maxHeight:"85vh",display:"flex",flexDirection:"column" }}>
        <div style={{ width:36,height:4,background:T.gray3,borderRadius:2,margin:"12px auto 0" }}/>
        <SidebarContent visual={visual} active={active} setActive={setActive} step={step} onClose={onClose}/>
      </div>
    </>
  );

  return (
    <div style={{ width:300,flexShrink:0,background:T.white,borderLeft:`1px solid ${T.gray3}`,display:"flex",flexDirection:"column",animation:"slideInRight 0.3s cubic-bezier(0.22,1,0.36,1)",overflow:"hidden" }}>
      <SidebarContent visual={visual} active={active} setActive={setActive} step={step} onClose={onClose}/>
    </div>
  );
}

function SidebarContent({ visual, active, setActive, step, onClose }) {
  return (
    <>
      {/* Header */}
      <div style={{ padding:"16px 20px 14px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.gray3}`,flexShrink:0 }}>
        <div style={{ width:38,height:38,borderRadius:19,background:T.redLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>👁</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:15,fontWeight:700,color:T.black }}>Guide visuel</div>
          <div style={{ fontSize:12,color:T.gray5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{visual.title}</div>
        </div>
        <button onClick={onClose} style={{ width:34,height:34,borderRadius:17,background:"transparent",border:"none",cursor:"pointer",color:T.gray5,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.background=T.gray2}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✕</button>
      </div>

      {/* Phone — key forces full remount on new guide so prev.current resets */}
      <div style={{ padding:"20px 8px 10px",flexShrink:0 }}>
        <PhoneMockup key={visual.title} step={step}/>
      </div>

      {/* Dots */}
      <div style={{ display:"flex",gap:5,justifyContent:"center",padding:"0 0 14px",flexShrink:0 }}>
        {visual.steps.map((_,i)=>(
          <div key={i} onClick={()=>setActive(i)} style={{ width:active===i?22:8,height:8,borderRadius:4,background:active===i?T.red:T.gray3,cursor:"pointer",transition:"all 0.25s" }}/>
        ))}
      </div>

      {/* Step cards */}
      <div style={{ flex:1,overflowY:"auto",padding:"0 16px 16px" }}>
        {visual.steps.map((s,i)=>(
          <div key={i} onClick={()=>setActive(i)} style={{ display:"flex",gap:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",borderRadius:14,background:active===i?T.redLight:"transparent",border:`1.5px solid ${active===i?T.red:T.gray3}`,transition:"all 0.2s",animation:`fadeUp 0.3s ease-out ${i*0.06}s both` }}>
            <div style={{ width:36,height:36,borderRadius:18,background:active===i?T.red:T.gray2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,transition:"all 0.2s" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:13,fontWeight:700,color:active===i?T.red:T.black,marginBottom:3 }}>{s.title}</div>
              <div style={{ fontSize:12,color:T.gray5,lineHeight:1.4 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div style={{ padding:"12px 20px 16px",borderTop:`1px solid ${T.gray3}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
        {[["←",()=>setActive(Math.max(0,active-1)),active===0],["→",()=>setActive(Math.min(visual.steps.length-1,active+1)),active===visual.steps.length-1]].map(([lbl,fn,dis],i)=>(
          <button key={i} onClick={fn} disabled={dis} style={{ width:40,height:40,borderRadius:20,background:dis?T.gray2:T.blueLight,border:"none",color:dis?T.gray4:T.blue,cursor:dis?"default":"pointer",fontSize:18,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}>{lbl}</button>
        ))}
        <span style={{ fontSize:13,color:T.gray5,fontWeight:500 }}>{active+1} / {visual.steps.length}</span>
      </div>
    </>
  );
}

// ─── TYPING ────────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display:"flex",gap:5,padding:"12px 16px" }}>
      {[0,1,2].map(i=><div key={i} style={{ width:8,height:8,borderRadius:"50%",background:T.blue,animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
    </div>
  );
}

// ─── MESSAGE ──────────────────────────────────────────────────────────────────
function Message({ msg, onShowVisual }) {
  const isUser=msg.role==="user";
  return (
    <div style={{ display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:16,animation:"fadeUp 0.25s ease-out" }}>
      {!isUser&&(
        <div style={{ width:36,height:36,borderRadius:18,background:T.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,marginRight:10,marginTop:2 }}>🧵</div>
      )}
      <div style={{ maxWidth:"min(72%, 680px)",display:"flex",flexDirection:"column",gap:8,alignItems:isUser?"flex-end":"flex-start" }}>
        <div style={{
          padding:"14px 20px",
          borderRadius:isUser?"22px 22px 4px 22px":"22px 22px 22px 4px",
          background:isUser?T.blue:T.white,
          color:isUser?"#fff":T.black,
          fontSize:"clamp(15px,1.8vw,17px)",
          lineHeight:1.65,
          boxShadow:isUser?`0 2px 12px ${T.blue}33`:`0 1px 3px ${T.sh}`,
          border:isUser?"none":`1px solid ${T.gray3}`,
          fontFamily:"inherit",
          whiteSpace:"pre-wrap",
        }}>{msg.content}</div>
        {!isUser&&msg.visual&&(
          <button onClick={()=>onShowVisual(msg.visual)}
            style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 18px",background:T.redLight,border:`1.5px solid ${T.red}`,borderRadius:24,cursor:"pointer",color:T.red,fontSize:13,fontWeight:600,fontFamily:"inherit",transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=T.red;e.currentTarget.style.color="#fff";}}
            onMouseLeave={e=>{e.currentTarget.style.background=T.redLight;e.currentTarget.style.color=T.red;}}>
            <span style={{ fontSize:16 }}>👁</span> Voir le guide visuel
          </button>
        )}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function LeFil() {
  const WELCOME={ role:"assistant", content:"Bonjour ! Je suis Fil, votre assistant numérique.\n\nJe suis là pour vous aider avec votre téléphone ou votre ordinateur.\n\nPas de souci si vous ne savez pas comment faire — on avance ensemble, doucement.", visual:null };
  const [messages,  setMessages]  = useState([WELCOME]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [visual,    setVisual]    = useState(null);
  const [showQuick, setShowQuick] = useState(true);
  const [mobile,    setMobile]    = useState(()=>window.innerWidth<700);
  const bottomRef=useRef(null);
  const textRef=useRef(null);

  useEffect(()=>{
    const fn=()=>setMobile(window.innerWidth<700);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  async function send(text) {
    const t=text||input.trim();
    if(!t||loading) return;
    setInput(""); setShowQuick(false);
    const nm=[...messages,{role:"user",content:t,visual:null}];
    setMessages(nm); setLoading(true);
    try {
      const res=await fetch("/api/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM_PROMPT,messages:nm.map(m=>({role:m.role,content:m.content}))}),
      });
      const data=await res.json();
      const raw=data.content?.[0]?.text||'{"message":"Je n\'ai pas compris. Pouvez-vous reformuler ?","visual":null}';
      let parsed;
      try{parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());}catch{parsed={message:raw,visual:null};}
      const msg={role:"assistant",content:parsed.message||"Désolé, je n'ai pas bien compris.",visual:parsed.visual||null};
      setMessages([...nm,msg]);
      if(parsed.visual) setVisual(parsed.visual);
    } catch {
      setMessages([...nm,{role:"assistant",content:"Désolé, un petit problème de connexion. Réessayez dans un moment.",visual:null}]);
    } finally { setLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Text:wght@400;500&display=swap');
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulseZone{0%,100%{box-shadow:0 0 0 0 rgba(234,67,53,0.45)}50%{box-shadow:0 0 0 7px rgba(234,67,53,0)}}
        @keyframes pulseDot{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.6)}}
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; overflow:hidden; background:${T.gray1}; }
        ::-webkit-scrollbar{ width:5px }
        ::-webkit-scrollbar-thumb{ background:${T.gray3}; border-radius:3px }
        textarea{ font-family:inherit; }
        textarea:focus{ outline:none; border-color:${T.blue}!important; box-shadow:0 0 0 2px ${T.blue}28!important; }
        textarea::placeholder{ color:${T.gray4}; }
        .chip:hover{ border-color:${T.blue}!important; background:${T.blueLight}!important; color:${T.blue}!important; }
        .foot-btn:hover{ border-color:${T.blue}!important; color:${T.blue}!important; background:${T.blueLight}!important; }
        .send-btn:hover:not(:disabled){ background:#1557B0!important; }
      `}</style>

      {/* ── FULL VIEWPORT APP SHELL */}
      <div style={{ height:"100vh", display:"flex", flexDirection:"column", fontFamily:"'Google Sans Text','Google Sans',system-ui,sans-serif", overflow:"hidden" }}>

        {/* ── TOP BAR — pleine largeur */}
        <div style={{ background:T.blue, padding:"0 24px", height:64, display:"flex", alignItems:"center", gap:16, flexShrink:0, zIndex:10 }}>
          <div style={{ width:40,height:40,borderRadius:20,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>🧵</div>
          <div>
            <div style={{ fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Google Sans',system-ui",letterSpacing:"-0.2px",lineHeight:1 }}>Fil</div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.72)",marginTop:2,lineHeight:1 }}>Votre assistant numérique</div>
          </div>
          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:14 }}>
            {visual&&!mobile&&(
              <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.18)",borderRadius:20,padding:"5px 14px",fontSize:13,color:"#fff",fontWeight:500 }}>
                <span>👁</span> Guide ouvert
              </div>
            )}
            <div style={{ display:"flex",alignItems:"center",gap:7 }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:"#81F199",flexShrink:0 }}/>
              <span style={{ fontSize:12,color:"rgba(255,255,255,0.72)",fontWeight:500 }}>En ligne</span>
            </div>
          </div>
        </div>

        {/* ── MAIN — chat + sidebar côte à côte, toute la hauteur restante */}
        <div style={{ flex:1, display:"flex", overflow:"hidden", background:T.gray1 }}>

          {/* CHAT COLUMN */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:T.white, borderRight:`1px solid ${T.gray3}` }}>

            {/* Messages — zone scrollable */}
            <div style={{ flex:1, overflowY:"auto", padding:"clamp(16px,3vw,40px) clamp(16px,5vw,80px)" }}>
              {messages.map((msg,i)=><Message key={i} msg={msg} onShowVisual={setVisual}/>)}
              {loading&&(
                <div style={{ display:"flex",alignItems:"center" }}>
                  <div style={{ width:36,height:36,borderRadius:18,background:T.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginRight:10,flexShrink:0 }}>🧵</div>
                  <div style={{ background:T.white,borderRadius:"18px 18px 18px 4px",border:`1px solid ${T.gray3}` }}><TypingDots/></div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Quick chips */}
            {showQuick&&(
              <div style={{ padding:"12px clamp(16px,5vw,80px) 14px",background:T.gray1,borderTop:`1px solid ${T.gray3}`,flexShrink:0 }}>
                <div style={{ fontSize:12,color:T.gray5,marginBottom:10,fontWeight:500 }}>Questions fréquentes :</div>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  {QUICK.map((a,i)=>(
                    <button key={i} className="chip" onClick={()=>send(a.prompt)}
                      style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:T.white,border:`1.5px solid ${T.gray3}`,borderRadius:24,cursor:"pointer",fontSize:13,color:T.black,fontFamily:"inherit",fontWeight:500,transition:"all 0.15s" }}>
                      <span style={{ fontSize:16 }}>{a.emoji}</span>{a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zone de saisie */}
            <div style={{ padding:"16px clamp(16px,5vw,80px) 20px",background:T.white,borderTop:`1px solid ${T.gray3}`,flexShrink:0 }}>
              <div style={{ display:"flex",gap:12,alignItems:"flex-end",maxWidth:860 }}>
                <textarea
                  ref={textRef}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                  placeholder="Écrivez votre question ici…"
                  rows={2}
                  style={{ flex:1,resize:"none",border:`1.5px solid ${T.gray3}`,borderRadius:16,padding:"13px 18px",fontSize:"clamp(15px,1.6vw,17px)",fontFamily:"inherit",color:T.black,background:T.gray1,lineHeight:1.55,transition:"border 0.15s,box-shadow 0.15s" }}
                />
                <button className="send-btn" onClick={()=>send()} disabled={loading||!input.trim()}
                  style={{ width:52,height:52,borderRadius:26,background:loading||!input.trim()?T.gray3:T.blue,border:"none",cursor:loading||!input.trim()?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,transition:"all 0.15s",flexShrink:0,color:"#fff",boxShadow:loading||!input.trim()?"none":`0 2px 8px ${T.blue}55` }}>
                  ➤
                </button>
              </div>
              <div style={{ marginTop:8,fontSize:11,color:T.gray4,maxWidth:860 }}>
                Entrée pour envoyer · Pas de question trop simple
              </div>
            </div>

            {/* Pied de page */}
            <div style={{ padding:"8px clamp(16px,5vw,80px) 10px",background:T.white,borderTop:`1px solid ${T.gray3}`,display:"flex",gap:8,flexShrink:0 }}>
              {[
                {lbl:showQuick?"Masquer les suggestions":"💡 Suggestions",fn:()=>setShowQuick(v=>!v)},
                {lbl:"↺ Recommencer",fn:()=>{setMessages([WELCOME]);setShowQuick(true);setVisual(null);}},
              ].map((b,i)=>(
                <button key={i} className="foot-btn" onClick={b.fn}
                  style={{ border:`1.5px solid ${T.gray3}`,background:"transparent",borderRadius:20,padding:"7px 16px",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:T.gray5,transition:"all 0.15s" }}>
                  {b.lbl}
                </button>
              ))}
            </div>
          </div>

          {/* SIDEBAR — desktop */}
          {visual&&!mobile&&<Sidebar visual={visual} onClose={()=>setVisual(null)} isMobile={false}/>}
        </div>
      </div>

      {/* SIDEBAR — mobile drawer */}
      {visual&&mobile&&<Sidebar visual={visual} onClose={()=>setVisual(null)} isMobile={true}/>}
    </>
  );
}
