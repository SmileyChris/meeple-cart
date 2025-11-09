/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Create discussion_categories collection
  const collection = new Collection({
    name: 'discussion_categories',
    type: 'base'
  });

  collection.fields.add(new TextField({
    name: 'slug',
    required: true,
    min: 1,
    max: 50,
    pattern: '^[a-z0-9-]+$'
  }));

  collection.fields.add(new TextField({
    name: 'name',
    required: true,
    min: 1,
    max: 100
  }));

  collection.fields.add(new TextField({
    name: 'icon',
    required: true,
    min: 1,
    max: 10
  }));

  collection.fields.add(new TextField({
    name: 'description',
    required: true,
    min: 1,
    max: 500
  }));

  collection.fields.add(new TextField({
    name: 'color',
    required: true,
    min: 4,
    max: 7,
    pattern: '^#[0-9a-fA-F]{6}$'
  }));

  collection.fields.add(new NumberField({
    name: 'order',
    required: true,
    min: 1
  }));

  collection.fields.add(new BoolField({
    name: 'enabled',
    required: true
  }));

  collection.listRule = '';
  collection.viewRule = '';

  app.save(collection);

  // Seed initial categories
  const categories = [
    {
      slug: 'game-talk',
      name: 'Game Talk',
      icon: '🎲',
      description: 'Reviews, strategy, mechanics, and general board game discussion',
      color: '#10b981',
      order: 1,
      enabled: true
    },
    {
      slug: 'wanted',
      name: 'Games Wanted / Group Buys',
      icon: '🔍',
      description: 'Wishlists, ISO posts, and group purchasing',
      color: '#f59e0b',
      order: 2,
      enabled: true
    },
    {
      slug: 'rules',
      name: 'Rules & House Variants',
      icon: '📖',
      description: 'Rule clarifications, FAQs, and custom variants',
      color: '#3b82f6',
      order: 3,
      enabled: true
    },
    {
      slug: 'meta',
      name: 'Meta / Platform Feedback',
      icon: '🗣️',
      description: 'Site feedback, bugs, features, and community discussion',
      color: '#8b5cf6',
      order: 4,
      enabled: true
    }
  ];

  categories.forEach((cat) => {
    const record = new Record(collection, cat);
    app.save(record);
  });
}, (app) => {
  const collection = app.findCollectionByNameOrId('discussion_categories');
  app.delete(collection);
});
