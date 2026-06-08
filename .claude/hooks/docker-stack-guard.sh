#!/usr/bin/env bash
# PreToolUse(Bash) guard for the SWOL project.
#
# This machine runs THREE supabase_db_* Docker stacks (SWOL + project-anvil +
# project-anvil-hq). A `docker ps | grep supabase_db | head -1` once resolved to
# project-anvil and a write landed in the WRONG database. This hook forces every
# docker command that touches a supabase_db container to name SWOL's explicitly:
#
#     docker exec supabase_db_SWOL psql -U postgres -c "..."
#
# It denies when the command (a) names a non-SWOL supabase_db_* container, or
# (b) enumerates containers (`docker ps`) alongside a supabase_db reference —
# i.e. dynamic resolution. See memory: swol-local-dev.

cmd=$(jq -r '.tool_input.command // ""')

# Not a docker command -> nothing to police.
grep -qE '(^|[^[:alnum:]_])docker([^[:alnum:]_]|$)' <<<"$cmd" || exit 0

deny() {
  jq -n --arg r "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

# (a) Any supabase_db_<name> that is not exactly supabase_db_SWOL.
while read -r name; do
  [ -z "$name" ] && continue
  if [ "$name" != "supabase_db_SWOL" ]; then
    deny "Blocked: command references '$name', not supabase_db_SWOL. SWOL's database is the supabase_db_SWOL container (host port 54622). Target it by exact name — never another stack (project-anvil / project-anvil-hq)."
  fi
done < <(grep -oE 'supabase_db_[A-Za-z0-9_.-]+' <<<"$cmd")

# (b) Dynamic resolution: `docker ps` used to find a supabase_db container.
if grep -qE 'docker[[:space:]]+ps' <<<"$cmd" && grep -q 'supabase_db' <<<"$cmd"; then
  deny "Blocked: command enumerates containers (docker ps) to resolve a supabase_db container — that's the grep|head footgun that hit the wrong stack before. Use the explicit name instead: docker exec supabase_db_SWOL ..."
fi

exit 0
