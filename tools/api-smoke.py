import json, urllib.request, urllib.error

API = "http://127.0.0.1:8000/api"

def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Accept", "application/json")
    if data:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")

ok = fail = 0
def check(label, cond, extra=""):
    global ok, fail
    if cond:
        ok += 1; print(f"  PASS  {label} {extra}")
    else:
        fail += 1; print(f"  FAIL  {label} {extra}")

st, login = call("POST", "/auth/login", {"email": "admin@igrejademo.test", "password": "escalas123"})
check("login admin", st == 200 and "token" in login)
T = login["token"]

st, bad = call("POST", "/auth/login", {"email": "admin@igrejademo.test", "password": "errada"})
check("login com senha errada -> 422", st == 422, str(bad.get("errors", {})))

st, me = call("GET", "/auth/me", token=T)
check("auth/me", st == 200 and me["user"]["role"] == "admin")

st, unauth = call("GET", "/ministries")
check("sem token -> 401", st == 401)

st, mins = call("GET", "/ministries?itemsPerPage=50", token=T)
check("ministerios", st == 200 and mins["total"] == 5, [m["name"] for m in mins["data"]])
louvor = next(m for m in mins["data"] if m["name"] == "Louvor")

st, fns = call("GET", f"/functions?ministry_id={louvor['_id']}&itemsPerPage=50", token=T)
check("funcoes do Louvor", st == 200 and fns["total"] == 6, [f["name"] for f in fns["data"]])

st, vols = call("GET", "/volunteers?itemsPerPage=5", token=T)
check("voluntarios", st == 200 and vols["total"] == 30, f"total={vols.get('total')}")

st, filtered = call("GET", f"/volunteers?ministry_id={louvor['_id']}&itemsPerPage=100", token=T)
check("voluntarios filtrados por ministerio", st == 200 and 0 < filtered["total"] < 30, f"total={filtered.get('total')}")

st, dash = call("GET", "/dashboard/summary", token=T)
check("dashboard responde", st == 200 and "coverage" in dash)
check("dashboard conta escalas do mes", dash["cards"]["schedules"] > 0,
      f"escalas={dash['cards']['schedules']} eventos={dash['cards']['events']}")
check("dashboard calcula cobertura", dash["coverage"]["needed"] > 0 and dash["coverage"]["filled"] > 0,
      str(dash["coverage"]))
check("dashboard calcula confirmacoes", dash["confirmation"]["confirmed"] > 0, str(dash["confirmation"]))
check("dashboard quebra por ministerio", len(dash["by_ministry"]) == 5,
      f"{len(dash['by_ministry'])} ministerios")
check("dashboard lista proximos eventos", len(dash["upcoming"]) > 0)

st, ev = call("GET", "/events?upcoming=1&itemsPerPage=3", token=T)
check("eventos futuros", st == 200 and ev["total"] > 0, f"total={ev['total']}")
future_event = ev["data"][0]

st, sch = call("GET", "/schedules?itemsPerPage=3", token=T)
check("escalas", st == 200 and sch["total"] > 0, f"total={sch['total']}")
schedule = sch["data"][0]

st, detail = call("GET", f"/schedules/{schedule['_id']}", token=T)
check("detalhe da escala", st == 200 and "slots" in detail,
      f"resumo={detail.get('summary')}")

if detail.get("slots"):
    fid = detail["slots"][0]["function_id"]
    st, cands = call("GET", f"/schedules/{schedule['_id']}/candidates?function_id={fid}", token=T)
    eligible = [c for c in cands.get("data", []) if c["eligible"]]
    check("candidatos elegiveis", st == 200,
          f"{len(cands.get('data', []))} candidatos, {len(eligible)} elegiveis")
    if cands.get("data"):
        c0 = cands["data"][0]
        print(f"        topo: {c0['volunteer']['name']} score={c0['score']} "
              f"blockers={[b['code'] for b in c0['blockers']]} warnings={[w['code'] for w in c0['warnings']]}")

# Cria evento novo + escala do zero e testa autofill/publicar
st, newev = call("POST", "/events", {
    "title": "Culto de Teste Automatizado",
    "type": "service",
    "starts_at": "2027-03-07T19:00:00",
    "ends_at": "2027-03-07T21:00:00",
    "location": "Templo Sede",
}, token=T)
check("criar evento", st == 201, newev.get("message"))
eid = newev["item"]["id"]

st, newsch = call("POST", "/schedules", {"event_id": eid, "ministry_id": louvor["id"]}, token=T)
check("criar escala com slots padrao", st == 201,
      f"slots={len(newsch['item'].get('slots', []))} resumo={newsch.get('summary')}")
sid = newsch["item"]["id"]

st, pub = call("POST", f"/schedules/{sid}/publish", token=T)
check("publicar escala vazia -> 422", st == 422, pub.get("message"))

st, auto = call("POST", f"/schedules/{sid}/autofill", {"allow_warnings": True}, token=T)
check("autofill", st == 200 and auto.get("created", 0) > 0,
      f"criadas={auto.get('created')} | {auto.get('message')}")

st, pub = call("POST", f"/schedules/{sid}/publish", {"force": True}, token=T)
check("publicar com force", st == 200, pub.get("message"))

st, detail2 = call("GET", f"/schedules/{sid}", token=T)
assignments = [a for s in detail2["slots"] for a in s["assignments"]]
check("escalacoes criadas", len(assignments) > 0, f"{len(assignments)} pessoas")

if assignments:
    aid = assignments[0]["id"]
    st, conf = call("POST", f"/assignments/{aid}/confirm", token=T)
    check("confirmar presenca", st == 200, conf.get("message"))

    st, chk = call("POST", f"/assignments/{aid}/checkin", {"attendance_status": "present"}, token=T)
    check("check-in", st == 200, chk.get("message"))

    st, swap = call("POST", "/swaps", {"assignment_id": aid, "reason": "Teste de troca"}, token=T)
    check("abrir pedido de troca", st == 201, swap.get("message"))
    swid = swap["item"]["id"]

    st, scands = call("GET", f"/swaps/{swid}/candidates", token=T)
    check("candidatos para a troca", st == 200, f"{len(scands.get('data', []))} candidatos")

    elig = [c for c in scands.get("data", []) if c["eligible"]]
    if elig:
        st, acc = call("POST", f"/swaps/{swid}/accept", {"volunteer_id": elig[0]["volunteer"]["id"]}, token=T)
        check("aceitar troca", st == 200, acc.get("message"))
        st, rev = call("POST", f"/swaps/{swid}/review", {"status": "approved"}, token=T)
        check("aprovar troca", st == 200, rev.get("message"))

# Duplicar escala em outro evento
st, ev2 = call("POST", "/events", {"title": "Culto Teste 2", "starts_at": "2027-03-14T19:00:00"}, token=T)
st, dup = call("POST", f"/schedules/{sid}/duplicate", {"event_id": ev2["item"]["id"], "copy_volunteers": True}, token=T)
check("duplicar escala", st == 201, dup.get("message"))

# Relatorios
for path in ["volunteers", "ministries", "attendance", "swaps"]:
    st, rep = call("GET", f"/reports/{path}?from=2026-01-01&to=2027-12-31", token=T)
    n = len(rep.get("data", [])) if isinstance(rep.get("data"), list) else None
    check(f"relatorio {path}", st == 200 and (n is None or n > 0), f"linhas={n}")
    if path == "ministries" and rep.get("data"):
        r0 = rep["data"][0]
        check("relatorio de ministerio traz numeros", r0["needed"] > 0 and r0["volunteers"] > 0,
              f"{r0['name']}: {r0['filled']}/{r0['needed']} cobertura={r0['coverage_rate']}%")

# Configuracoes
st, cfg = call("GET", "/settings", token=T)
check("configuracoes", st == 200 and len(cfg["data"]) > 10, f"{len(cfg.get('data', []))} chaves")
st, upd = call("PUT", "/settings", {"settings": {"scheduling.min_rest_days": 10}}, token=T)
check("salvar configuracao", st == 200, upd.get("message"))

# Papeis restritos
st, vlogin = call("POST", "/auth/login", {"email": "voluntario@igrejademo.test", "password": "escalas123"})
VT = vlogin["token"]
st, mine = call("GET", "/me/dashboard", token=VT)
check("painel do voluntario", st == 200 and mine.get("volunteer") is not None,
      f"proximas={len(mine.get('next_assignments', []))} pendentes={mine.get('pending_confirmations')}")
st, denied = call("GET", "/settings", token=VT)
check("voluntario nao acessa configuracoes -> 403", st == 403, denied.get("message"))
st, denied2 = call("PUT", "/settings", {"settings": {}}, token=VT)
check("voluntario nao altera configuracoes -> 403", st == 403)

# Validacao
st, invalid = call("POST", "/ministries", {}, token=T)
check("validacao 422 com errors", st == 422 and "errors" in invalid, list(invalid.get("errors", {}).keys()))

# 404
st, nf = call("GET", "/ministries/000000000000000000000000", token=T)
check("inexistente -> 404", st == 404, nf.get("message"))

print(f"\n  {ok} passaram, {fail} falharam")
