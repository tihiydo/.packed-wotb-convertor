#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;

const env = require("./src/env/env")
const webp = require("./src/utils/webp")

var unpack = false

async function main() 
{
    const realArgs = process.argv.slice(2);
    if (realArgs.length === 0)
    {
        throw 'No mode selected'
    }

    unpack = realArgs[0].toLowerCase() === 'unpack' || realArgs[0].toLowerCase() === 'u';
    const fullPath = process.cwd()
    const files = await searchFiles(fullPath);
    await processFiles(files, unpack);
}

async function searchFiles(directory) 
{
    const directoryPath = path.resolve(directory);
    const filesList = [];

    try 
    {
        const fileNames = await fs.readdir(directoryPath);

        for (const fileName of fileNames) 
        {
            const filePath = path.join(directoryPath, fileName);
            const stats = await fs.stat(filePath);

            if (stats.isFile() && fileName.endsWith(env.WEBP_EXTENSION_SLUG)) 
            {
                if (unpack) 
                {
                    filesList.push(filePath);
                }
                else 
                {
                    const txtFilePath = path.join(directoryPath, fileName.slice(0, -env.WEBP_EXTENSION_SLUG.length) + env.TXT_EXTENSION_SLUG);
                    if (await fs.access(txtFilePath).then(() => true).catch(() => false)) 
                    {
                        filesList.push(filePath);
                    }
                }
            } 
            else if (stats.isDirectory()) 
            {
                // Рекурсивно вызываем функцию для подпапки
                const subfolderFiles = await searchFiles(filePath);
                filesList.push(...subfolderFiles);
            }
        }

        return filesList;
    } 
    catch (error) 
    {
        console.error('Error while searching files:', error);
        return [];
    }
}

async function processFiles(filePaths) 
{
    const tasks = filePaths.map(processFile);
    await Promise.all(tasks);
}

function processFile(filePath) 
{
    if (unpack) 
    {
        return webp.unpack(filePath);
    } 
    else
    {
        return webp.pack(filePath, filePath.slice(0, -env.WEBP_EXTENSION_SLUG.length) + env.TXT_EXTENSION_SLUG);
    }
}

main().catch((error) => 
{
    console.error(error);
    process.exit(1);
})