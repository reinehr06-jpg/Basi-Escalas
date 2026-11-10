#!/usr/bin/env python3
"""
Verifica se algo do "Front Atualizado" (repo de trabalho atual) ficou de fora
do "BasileiaRev1" (pasta unificada que foi subida na branch New_Adm_Page_Vini).

Como as rotas foram renomeadas de PT -> EN na unificação, uma comparação
ingênua de arquivo-por-arquivo não funciona: este script primeiro traduz o
CAMINHO e o CONTEÚDO de cada arquivo do Front Atualizado usando exatamente as
mesmas regras aplicadas na hora da unificação, e só então compara com o que
existe de fato no BasileiaRev1. Isso separa "diferença esperada por causa da
renomeação" de "coisa que realmente ficou pra trás".

Uso:
    python3 scripts/verify_sync.py
"""

import os
import filecmp

SOURCE = os.path.expanduser("~/Documents/Front Atualizado")
TARGET = os.path.expanduser("~/Documents/BasileiaRev1")

# Diretórios/arquivos que nunca devem ser comparados
IGNORE_DIRS = {"node_modules", ".next", ".git", "out", ".turbo"}
IGNORE_FILES = {"tsconfig.tsbuildinfo"}

# Arquivos/pastas que só existem no BasileiaRev1 de propósito (trazidos de
# outro lugar, não do Front Atualizado) — não é "perda", é adição conhecida.
KNOWN_ADDITIONS_PREFIXES = [
    "src/app/admin/",
    "src/components/admin/",
    "src/components/PowerButton.tsx",
    "src/context/AdminContext.tsx",
    "src/types/admin.ts",
    "src/data/mockAdminData.ts",
    "src/services/person.service.ts",
    "src/services/positions.service.ts",
    "src/services/tags.service.ts",
    "src/services/visitors.service.ts",
    "MERGE_NOTES.md",
    "API_CONTRACT.md",
    "INTEGRATION.md",
]

# Ordem importa: do mais especifico pro mais generico (mesmas regras usadas
# na unificação original).
PATH_REPLACEMENTS = [
    # rotas do app principal
    ("/cadastros/membros/anotacoes", "/registers/members/notes"),
    ("/cadastros/membros/importar", "/registers/members/import"),
    ("/cadastros/membros/novo", "/registers/members/new"),
    ("/cadastros/membros/editar", "/registers/members/edit"),
    ("/cadastros/membros", "/registers/members"),
    ("/cadastros/cargos", "/registers/positions"),
    ("/cadastros/ministerios", "/registers/ministries"),
    ("/cadastros/redes", "/registers/networks"),
    ("/cadastros/visitantes/contatos", "/registers/visitors/contacts"),
    ("/cadastros/visitantes", "/registers/visitors"),
    ("/cadastros", "/registers"),
    ("/celulas/cadastro/importar", "/cells/register/import"),
    ("/celulas/cadastro", "/cells/register"),
    ("/celulas/metricas", "/cells/metrics"),
    ("/celulas/perfil", "/cells/profiles"),
    ("/celulas", "/cells"),
    ("/configuracoes/conexoes", "/settings/connections"),
    ("/configuracoes/formularios", "/settings/forms"),
    ("/configuracoes/planos", "/settings/plans"),
    ("/configuracoes/relatorios", "/settings/reports"),
    ("/configuracoes/seguranca", "/settings/security"),
    ("/configuracoes/termos", "/settings/terms"),
    ("/configuracoes/conta", "/settings/account"),
    ("/configuracoes", "/settings"),
    ("/cuidado-pastoral", "/solicitations"),
    ("/cultos/aceitou-jesus/registros", "/cults/acceptedJesus/registers"),
    ("/cultos/aceitou-jesus/config", "/cults/acceptedJesus/config"),
    ("/cultos/aceitou-jesus", "/cults/acceptedJesus"),
    ("/cultos/agenda", "/cults/schedule"),
    ("/cultos/registro", "/cults/attendance"),
    ("/cultos", "/cults"),
    ("/cursos/inscritos", "/courses/registrant"),
    ("/cursos/novo", "/courses/new"),
    ("/cursos", "/courses"),
    ("/eventos/inscritos", "/events/registrant"),
    ("/eventos/novo", "/events/new"),
    ("/eventos", "/events"),
    ("/filiais", "/branches"),
    ("/qr-codes/novo", "/qr-codes/new"),
    ("/usuarios", "/systemUsers"),
    ("/assistente/notificacoes", "/ai_configs/notifications"),
    ("/assistente/perfil", "/ai_configs/profile"),
    ("/assistente", "/ai_configs"),
    ("/novo", "/new"),
    ("/editar", "/edit"),
    ("/importar", "/import"),
    ("/inscritos", "/registrant"),
    ("/registros", "/registers"),
    ("/anotacoes", "/notes"),
    ("/contatos", "/contacts"),
    ("/membros", "/members"),
    ("/redes", "/networks"),
    ("/relatorios", "/reports"),
]

# Arquivos que são camada de BACKEND (chamadas de API), não rota de front —
# não devem ser traduzidos pelo dicionário acima (foi exatamente o erro que
# cometi na primeira passada e tive que reverter).
BACKEND_LAYER_FILES = {
    "src/mocks/browser.ts",
    "src/mocks/handlers/membros.ts",
    "src/hooks/useMembros.ts",
    "src/services/celulas.service.ts",
    "src/services/members.service.ts",
    "src/services/eventos.service.ts",
    "src/services/membros.service.ts",
    "src/services/cultos.service.ts",
}


def translate_path(rel_path: str) -> str:
    new_path = rel_path
    for old, new in PATH_REPLACEMENTS:
        old_seg = old.lstrip("/")
        new_seg = new.lstrip("/")
        new_path = new_path.replace(old_seg, new_seg)
    return new_path


def translate_content(rel_path: str, content: str) -> str:
    if rel_path in BACKEND_LAYER_FILES:
        return content
    for old, new in PATH_REPLACEMENTS:
        content = content.replace(old, new)
    return content


def is_known_addition(rel_path: str) -> bool:
    return any(rel_path.startswith(p) or rel_path == p for p in KNOWN_ADDITIONS_PREFIXES)


def collect_files(root: str):
    result = {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        for fname in filenames:
            if fname in IGNORE_FILES:
                continue
            full = os.path.join(dirpath, fname)
            rel = os.path.relpath(full, root)
            result[rel] = full
    return result


def main():
    print(f"Comparando:\n  ORIGEM: {SOURCE}\n  DESTINO: {TARGET}\n")

    source_files = collect_files(SOURCE)
    target_files = collect_files(TARGET)

    missing = []          # existe na origem, deveria existir no destino, nao existe
    content_drift = []    # existe nos dois, mas o conteudo diverge alem da renomeacao esperada
    ok_count = 0

    for rel_path, src_full in sorted(source_files.items()):
        expected_rel = translate_path(rel_path)
        expected_full = os.path.join(TARGET, expected_rel)

        if not os.path.exists(expected_full):
            missing.append((rel_path, expected_rel))
            continue

        # Compara conteudo (so pra arquivos de texto razoaveis; ignora binarios)
        try:
            with open(src_full, "r", encoding="utf-8") as f:
                src_content = f.read()
            with open(expected_full, "r", encoding="utf-8") as f:
                dst_content = f.read()
        except (UnicodeDecodeError, IsADirectoryError):
            ok_count += 1
            continue

        normalized_src = translate_content(rel_path, src_content)

        if normalized_src == dst_content:
            ok_count += 1
        else:
            content_drift.append((rel_path, expected_rel))

    # Arquivos que existem no destino mas nao tem origem conhecida (nem
    # traduzido, nem adicao conhecida)
    extra = []
    translated_targets = {translate_path(p) for p in source_files}
    for rel_path in sorted(target_files):
        if rel_path in translated_targets:
            continue
        if is_known_addition(rel_path):
            continue
        extra.append(rel_path)

    print(f"✅ Arquivos batendo certinho (renomeação esperada, sem perda): {ok_count}")
    print()

    if missing:
        print(f"❌ FALTANDO no BasileiaRev1 ({len(missing)}):")
        for orig, expected in missing:
            print(f"   - {orig}  (esperado em: {expected})")
        print()
    else:
        print("❌ Faltando: nenhum arquivo perdido.\n")

    if content_drift:
        print(f"⚠️  CONTEÚDO DIFERENTE além da renomeação esperada ({len(content_drift)}):")
        for orig, expected in content_drift:
            print(f"   - {orig}  (comparado com: {expected})")
        print()
    else:
        print("⚠️  Divergência de conteúdo: nenhuma.\n")

    if extra:
        print(f"ℹ️  Arquivos extras no BasileiaRev1 sem origem conhecida ({len(extra)}) — revisar manualmente:")
        for f in extra:
            print(f"   - {f}")
        print()
    else:
        print("ℹ️  Nenhum arquivo extra não identificado.\n")

    print("=" * 60)
    if not missing and not content_drift and not extra:
        print("TUDO CERTO — nada foi perdido na troca de pastas.")
    else:
        print("Reveja os itens marcados acima antes de considerar sincronizado.")


if __name__ == "__main__":
    main()
