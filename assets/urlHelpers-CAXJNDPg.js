const t=(t,s="https://www.regeringen.se")=>t?t.startsWith("http://")||t.startsWith("https://")?t:t.startsWith("/")?`${s}${t}`:t:null;export{t as g};
