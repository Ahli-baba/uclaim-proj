const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        value: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Seed default categories if collection is empty
categorySchema.statics.seedDefaults = async function () {
    const count = await this.countDocuments();
    if (count === 0) {
        await this.insertMany([
            { name: "Electronics", value: "Electronics", order: 1 },
            { name: "Documents", value: "Documents", order: 2 },
            { name: "Bags & Luggage", value: "Bags", order: 3 },
            { name: "Keys", value: "Keys", order: 4 },
            { name: "Wallet & Cards", value: "Wallet", order: 5 },
            { name: "Clothing", value: "Clothing", order: 6 },
            { name: "Others", value: "Others", order: 7 },
        ]);
        console.log("Default categories seeded.");
    }
};

module.exports = mongoose.model("Category", categorySchema);