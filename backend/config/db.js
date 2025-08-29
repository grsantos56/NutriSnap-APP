import mysql from 'mysql2/promise';

const bancoDados = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '12435687',
  database: process.env.DB_NAME || 'nutrisnap',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Testa a conexão com o banco de dados
async function testarConexao() {
  try {
    const conexao = await bancoDados.getConnection();
    console.log('✅ Conectado ao banco MySQL');
    console.log(`📊 Banco: ${process.env.DB_NAME || 'nutrisnap'}`);
    console.log(`🌐 Host: ${process.env.DB_HOST || 'localhost'}`);
    conexao.release();
  } catch (err) {
    console.log('❌ Erro ao conectar ao banco:', err.message);
    console.log('💡 Dicas para resolver:');
    console.log('   1. Verifique se o MySQL está rodando');
    console.log('   2. Verifique se o usuário e senha estão corretos');
    console.log('   3. Verifique se o banco "nutrisnap" existe');
    console.log('   4. Execute: mysql -u root -p < schema.sql');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

testarConexao();

export default bancoDados;