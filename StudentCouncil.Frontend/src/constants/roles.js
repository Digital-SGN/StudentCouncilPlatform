export const ROLES = [
    'Главный организатор',
    'Ответственный за направление',
    'Организатор',
    'Спикер',
    'Медиа',
    'Техпод',
    'Волонтёр',
];

export const ROLE_STYLES = {
    'Главный организатор':          { background: '#0CBFA1', color: 'white' },
    'Ответственный за направление': { background: '#09707C', color: 'white' },
    'Организатор':                  { background: '#148C9C', color: 'white' },
    'Спикер':                       { background: '#9B59B6', color: 'white' },
    'Медиа':                        { background: '#FF6B6B', color: 'white' },
    'Техпод':                       { background: '#4ECDC4', color: 'white' },
    'Волонтёр':                     { background: '#FFE66D', color: '#2d3748' },
};


export function roleOrder(role) {
    const idx = ROLES.indexOf(role);
    return idx === -1 ? ROLES.length : idx;
}