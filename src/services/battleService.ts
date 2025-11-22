import db from '../configs/database.ts'

export async function startBattle(sessionID : any)  {
    await db.execute('UPDATE battle_sessions SET status = ? WHERE status = ? AND sessionID = ?', ['IN PROGRESS', 'NOT YET STARTED', sessionID]);
    let rola;
    let rolaB;
    if (Math.random() < 0.5) {
      rola = 'OBRONCA';
      rolaB = 'OBALATOR';
    } else {
       rola = 'OBALATOR';
         rolaB = 'OBRONCA';
    }

    await db.execute('UPDATE battle_sessions SET A_role = ?, B_role = ? WHERE sessionID = ?', [rola, rolaB, sessionID]);
    console.log(rola, rolaB);
    return { a: rola, b: rolaB };

}