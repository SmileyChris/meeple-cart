/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const trades = app.findCollectionByNameOrId("trades")
    const notifications = app.findCollectionByNameOrId("notifications")

    // 1. Update trades.status options
    const statusField = trades.fields.find(f => f.name === "status")
    if (statusField && statusField.options) {
        statusField.options.values = [
            "initiated",
            "accepted",
            "shipped",
            "received",
            "completed",
            "disputed",
            "cancelled"
        ]
    }

    // 2. Add tracking fields to trades
    trades.fields.add(new TextField({
        name: "tracking_number",
        required: false,
    }))

    trades.fields.add(new DateField({
        name: "shipped_at",
        required: false,
    }))

    trades.fields.add(new DateField({
        name: "received_at",
        required: false,
    }))

    // 3. Update notifications.type options
    const notifTypeField = notifications.fields.find(f => f.name === "type")
    if (notifTypeField && notifTypeField.options) {
        const existing = notifTypeField.options.values || []
        const newTypes = [
            "offer_received",
            "offer_accepted",
            "offer_declined",
            "trade_shipped",
            "trade_received",
            "trade_completed",
            "trade_cancelled"
        ]
        notifTypeField.options.values = [...new Set([...existing, ...newTypes])]
    }

    app.save(trades)
    app.save(notifications)
}, (app) => {
    const trades = app.findCollectionByNameOrId("trades")
    const notifications = app.findCollectionByNameOrId("notifications")

    // Revert trades.status
    const statusField = trades.fields.find(f => f.name === "status")
    if (statusField && statusField.options) {
        statusField.options.values = ["initiated", "confirmed", "completed", "disputed", "cancelled"]
    }

    // Remove tracking fields
    try { trades.fields.removeByName("tracking_number") } catch (e) { }
    try { trades.fields.removeByName("shipped_at") } catch (e) { }
    try { trades.fields.removeByName("received_at") } catch (e) { }

    // Revert notifications.type (partial revert is tricky, usually we just leave them)

    app.save(trades)
    app.save(notifications)
})
