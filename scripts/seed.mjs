import fs from 'node:fs';
import path from 'node:path';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
if(process.env.DEMO_DATA!=='yes')throw Error('Demo seed only: set DEMO_DATA=yes in a disposable database');
const db=await getDb();try{await migrate(db);await db.exec('BEGIN');await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');console.log('Fictional demo seeded');}finally{await db.close();}
