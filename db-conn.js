const {MongoClient} = require('mongodb');

const url = process.env.MONGO_URL;
const dbName = 'cortex';

const client = new MongoClient(
    url,
    {useUnifiedTopology: true}
);

const eventualConnection = client.connect();
/**
 * @type {Promise<Db>}
 */
const eventualDb = eventualConnection.then(() => client.db(dbName));

module.exports = {
    eventualDb,
    closeDb: () => client.close()
};
