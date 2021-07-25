module.exports = {
  async up(db) {
    const result = await db.collection('campaigns').insertOne({
      title: 'Default',
      slug: 'default',
      icon_url: null,
      banner_url: null,
      description: '',
      users: []
    });

    const campaign_id = result._id;

    await db.collection('campaigns').createIndex({"slug": 1}, {unique: true});

    await db.collection('characters').updateMany({}, {$set: {campaign_id}});
    await db.collection('snippets').updateMany({}, {$set: {campaign_id}});
    await db.collection('assets').updateMany({}, {$set: {campaign_id}});
  },

  async down(db) {
    await db.collection('characters').updateMany({}, {$unset: {campaign_id: ""}});
    await db.collection('snippets').updateMany({}, {$unset: {campaign_id: ""}});
    await db.collection('assets').updateMany({}, {$unset: {campaign_id: ""}});

    await db.collection('campaigns').drop();
  }
};
