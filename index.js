const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

// Function to check the status code of a URL
const checkUrlStatus = async (url) => {
    try {
        const response = await axios.get(url, { maxRedirects: 0 });
        return response.status;
    } catch (error) {
        if (error.response) {
            return error.response.status;
        } else {
            console.error(`Error checking ${url}:`, error.message);
            return 'Error';
        }
    }
};

// Function to read URLs from CSV and check their status codes
const checkUrlsFromCsv = async (csvFilePath) => {
    const results = [];

    // Set the output file name
    const outputFilePath = 'files/controlled/'+path.basename(csvFilePath, path.extname(csvFilePath)) + '_checked.csv';

    // Create CSV writer
    const csvWriter = createCsvWriter({
        path: outputFilePath,
        header: [
            {id: 'url', title: 'URL'},
            {id: 'statusCode', title: 'Status Code'}
        ]
    });

    // Read the input CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const records = [];
            for (const row of results) {
                const url = row.URL;
                const statusCode = await checkUrlStatus(url);
                records.push({ url, statusCode });

                // Log the result
                if (statusCode !== 301 || statusCode !== 302 || statusCode !== 200) {
                    console.error(`URL: ${url} | Status Code: ${statusCode}`);
                }else{
                    console.log(`URL: ${url} | Status Code: ${statusCode}`);
                }
            }
            // Write the results to the new CSV file
            await csvWriter.writeRecords(records);
            //console.log(`The CSV file was written successfully to ${outputFilePath}`);
        });
};


// Function to read all CSV files from a directory and check URLs
const checkUrlsFromDirectory = (directoryPath) => {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error(`Unable to read directory: ${err.message}`);
            return;
        }
        console.log(files);
        files.forEach((file) => {
            const filePath = path.join(directoryPath, file);
            if (path.extname(file) === '.csv') {
                checkUrlsFromCsv(filePath);
            }
        });
    });
};

const directoryPath = 'files';
checkUrlsFromDirectory(directoryPath);
