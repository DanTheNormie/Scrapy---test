/* server config */
const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()
const axios = require('axios')
const PORT = process.env.PORT || 3000

/* puppeteer config */
const { Cluster } = require('puppeteer-cluster')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const useProxy = require('puppeteer-page-proxy');
puppeteer.use(StealthPlugin())

/* scrape script */
const taskRunner = require('./scrape_scripts/scraping_script')

/* Database config */
const mongoose = require('mongoose')

let cluster;

async function attachPuppeteer(req, res, next) {
    if (!req.puppeteer) {
        req.puppeteer = { cluster }
    }
    next()
}
/* config */
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(attachPuppeteer)

async function customScrape(req, res){
    const {task} = req.body
    const {cluster} = req.puppeteer

    try{
        return await cluster.execute(task, async ({page, data})=>{
           /*  page.setRequestInterception(true)
            
            page.on ( 'request', async request => {
                if ( request.resourceType () === 'stylesheet' || request.resourceType () === 'image' || request.resourceType () === 'media' || request.resourceType () === 'font' ) {
                    request.abort ()
                } else {
                    request.continue ()
                }
            }) */

            try{
                const torrents_data_array = await taskRunner(page, data)
                console.log(torrents_data_array.length);

                if(torrents_data_array[0].title === 'No results returned'){
                    return res.status(404).json({
                        success:false,
                        message:"No Data found for given Keyword"
                    })
                }

                return res.json({
                    success:true,
                    data:torrents_data_array,
                    message:'Data Fetched Successfully'
                })

            }catch(err){
                let image;
                try{
                    console.log('trying to take screenshot...');
                    image = await page.screenshot({encoding:'base64', fullPage:true})
                }
                catch(err){
                    console.log(err);
                    throw new Error("failed to upload screenshot")
                }
                    
                    let res = await axios.post(
                        'https://api.imgbb.com/1/upload?key=48e10968d05dbb32dcc2f896ddc452c0&expiration=120',
                        {image:image},{
                            headers:{
                                'Content-Type': 'multipart/form-data',
                            }
                        })
                    throw new Error(`Screenshot uploaded to ${res.data.data.url}`,{cause : err.message})
            }
        })

    }catch(err){
        return res.json({
            success:false,
            message:"Request Failed (or) No data for given keyword",
            error:err.message
        })
    }
}

app.post('/', customScrape);

async function startServer(){
    
    const startPuppeteer = (async () => {
        console.log('Starting puppeteer browser...');
        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 5,
            puppeteerOptions: {
                headless: 'new'
            },
            timeout:1200000,
            puppeteer:puppeteer,
        })
        cluster.on('taskerror', (err, data, willRetry) => {
            if (willRetry) {
              console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
            } else {
              console.error(`Failed to crawl ${data}: ${err.message}`);
            }
        });
        console.log('puppeteer browser running');
    })()

    
    
    const connectDB = (async ()=>{
        console.log('Connecting to DB...');
        mongoose.connect('mongodb://127.0.0.1:27017/customsearchtool')
            .then(()=>{console.log('DB connected');})
            .catch((err)=>{console.log(`Couldn\'t connect to DB, ${err}`);})
    })()

    try{
        await Promise.all([startPuppeteer, connectDB])
    }catch(err){
        console.log(err);
    }
    

    app.listen(PORT,()=>{console.log(`server running at port ${PORT}`);})
}

startServer()


