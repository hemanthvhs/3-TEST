const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then(() => console.log('DB Connection Successful !'));

// BULK INSERT INTO DB

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

const importData = async () => {
    try {
        await Tour.create(tours);
        console.log('Data inserted successfully!');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log('Data deleted successfully');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

//console.log(process.argv); // This show all the args which we have entered
// node ./dev-data/data/import-dev-data.js --import
// node ./dev-data/data/import-dev-data.js --delete

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}
