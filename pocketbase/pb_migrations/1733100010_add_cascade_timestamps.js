/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add created/updated timestamps to cascades collection
 *
 * The cascades collection was created as a base type but didn't include
 * the standard created/updated autoDate fields. This fixes that.
 */
migrate((app) => {
  const cascades = app.findCollectionByNameOrId('cascades');

  // Add created field
  if (!cascades.fields.getByName('created')) {
    cascades.fields.add(new AutodateField({
      name: 'created',
      onCreate: true,
    }));
  }

  // Add updated field
  if (!cascades.fields.getByName('updated')) {
    cascades.fields.add(new AutodateField({
      name: 'updated',
      onCreate: true,
      onUpdate: true,
    }));
  }

  app.save(cascades);

  // Also add to cascade_entries
  const cascadeEntries = app.findCollectionByNameOrId('cascade_entries');

  if (!cascadeEntries.fields.getByName('created')) {
    cascadeEntries.fields.add(new AutodateField({
      name: 'created',
      onCreate: true,
    }));
  }

  if (!cascadeEntries.fields.getByName('updated')) {
    cascadeEntries.fields.add(new AutodateField({
      name: 'updated',
      onCreate: true,
      onUpdate: true,
    }));
  }

  app.save(cascadeEntries);

  // Also add to cascade_history
  const cascadeHistory = app.findCollectionByNameOrId('cascade_history');

  if (!cascadeHistory.fields.getByName('created')) {
    cascadeHistory.fields.add(new AutodateField({
      name: 'created',
      onCreate: true,
    }));
  }

  if (!cascadeHistory.fields.getByName('updated')) {
    cascadeHistory.fields.add(new AutodateField({
      name: 'updated',
      onCreate: true,
      onUpdate: true,
    }));
  }

  app.save(cascadeHistory);

}, (app) => {
  // Rollback: remove the fields
  const cascades = app.findCollectionByNameOrId('cascades');
  try { cascades.fields.removeByName('created'); } catch (e) {}
  try { cascades.fields.removeByName('updated'); } catch (e) {}
  app.save(cascades);

  const cascadeEntries = app.findCollectionByNameOrId('cascade_entries');
  try { cascadeEntries.fields.removeByName('created'); } catch (e) {}
  try { cascadeEntries.fields.removeByName('updated'); } catch (e) {}
  app.save(cascadeEntries);

  const cascadeHistory = app.findCollectionByNameOrId('cascade_history');
  try { cascadeHistory.fields.removeByName('created'); } catch (e) {}
  try { cascadeHistory.fields.removeByName('updated'); } catch (e) {}
  app.save(cascadeHistory);
});
