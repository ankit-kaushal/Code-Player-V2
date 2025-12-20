import { MongoClient, Db, Collection, Document } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

const getConnectionString = (): string => {
  const authUser = process.env.DB_USERNAME;
  const authPass = process.env.DB_PASSWORD;
  const cluster = process.env.DB_CLUSTER;
  const dbName = process.env.DB_NAME;

  if (!authUser || !authPass || !cluster || !dbName) {
    throw new Error('Missing MongoDB environment variables: DB_USERNAME, DB_PASSWORD, DB_CLUSTER, DB_NAME');
  }

  const encodedUser = encodeURIComponent(authUser);
  const encodedPass = encodeURIComponent(authPass);

  const uri = `mongodb+srv://${encodedUser}:${encodedPass}@${cluster}.s7w4ras.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=${cluster}`;
  
  return uri;
};

export const connectDatabase = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  try {
    const uri = getConnectionString();
    console.log('Connecting to MongoDB...');
    
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      // TLS options
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    
    await client.connect();
    db = client.db();
    
    // Test the connection
    await db.admin().ping();
    console.log('✅ Connected to MongoDB successfully');
    return db;
  } catch (error: any) {
    console.error('❌ Error connecting to MongoDB:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    // Provide helpful error messages
    if (error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      console.error('❌ Authentication failed. Please check:');
      console.error('   - DB_USERNAME is correct');
      console.error('   - DB_PASSWORD is correct (URL encode special characters)');
      console.error('   - User has proper permissions in MongoDB Atlas');
    } else if (error.message?.includes('getaddrinfo ENOTFOUND') || error.message?.includes('ENOTFOUND')) {
      console.error('❌ Cannot resolve hostname. Please check:');
      console.error('   - DB_CLUSTER name matches your MongoDB Atlas cluster name exactly');
      console.error('   - Cluster name should be the part before .s7w4ras.mongodb.net');
    } else if (error.message?.includes('TLS') || error.message?.includes('SSL') || error.message?.includes('tlsv1')) {
      console.error('❌ TLS/SSL connection error. Please check:');
      console.error('   - Your IP address is whitelisted in MongoDB Atlas Network Access');
      console.error('   - Try adding 0.0.0.0/0 temporarily for testing (not recommended for production)');
      console.error('   - Check firewall settings');
    } else if (error.message?.includes('timeout')) {
      console.error('❌ Connection timeout. Please check:');
      console.error('   - Network connectivity');
      console.error('   - MongoDB Atlas cluster is running');
    }
    
    if (client) {
      await client.close().catch(() => {});
      client = null;
      db = null;
    }
    throw error;
  }
};

export const getDb = async (): Promise<Db> => {
  if (!db) {
    return await connectDatabase();
  }
  return db;
};

export const getCollection = async <T extends Document = Document>(collectionName: string): Promise<Collection<T>> => {
  const database = await getDb();
  return database.collection<T>(collectionName);
};

export const closeDatabase = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
};

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  CODES: 'codes',
  EMAIL_SENT: 'email_sent',
} as const;
