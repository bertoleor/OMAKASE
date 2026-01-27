# Skill: Restaurant System Integrity

## Constraints

1. No usar comentarios descriptivos.
2. Nomenclatura basada estrictamente en el dominio: (Reservation, MenuSection, TableInventory, KitchenOrder).
3. Prohibido el uso de logic hooks dentro de componentes de la carpeta /ui.
4. Obligatorio el uso de la clase AppError para cualquier interrupción del flujo.
5. Los componentes deben seguir el patrón de Composición de Componentes.

## Evaluation

Antes de cada commit, se debe ejecutar:
npx ts-node .agent/skills/restaurant-auditor/audit-engine.ts
