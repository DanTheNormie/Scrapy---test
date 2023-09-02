const test_task = require('./taskChecker')
const path = require('path')
const timeUtil = require('./utils/date-time.utils')

function replaceUrlParams(task){
    return task.url.replace(/{{(.*?)}}/g, (match, paramName) => {
        
        if (task.params && task.params[paramName]) {
            if(task.params[paramName].value){
                return task.params[paramName].value
            }
          return task.params[paramName].default;
        } else {
          console.error(`Required parameter "${paramName}" not provided for URL: ${task.url}`);
          return null;
        }
    });
}

async function scrapeAllSelectorsTogether(page, selectors_array, parentSelector){
    const pageFunction = (elements, selectors_array) =>{
        if(elements===undefined || elements.length == 0){
            /* parentElementSelector not present meaning there is no data to scrape */
            
            throw new Error(`No data found`)
        }
        
        return elements.map((e)=>{
            const result = {};
            const error = {};
            for(const selectorInfo of selectors_array){
                const {name, target, selector} = selectorInfo
                result[name] = e.querySelector(selector)
                if(result[name] !== null){
                    if(target !== "innerText" && result[name].hasAttribute(target)){    
                        result[name] = result[name].getAttribute(target)
                    }else if(target === 'innerHTML'){
                        result[name] = result[name].innerHTML
                    }
                    else{
                        result[name] = result[name].innerText
                    }
                    
                    if(result[name] == '' || result[name].length == 0){
                        result[name] = `No Data found`
                    }
                }else{
                    result[name] = `No Data found`
                }
                
                /* todo: add fallbacks if no data found for selector */
            }
            return result;
        })
    }
    try{
        
        const result = await page.$$eval(parentSelector,pageFunction,selectors_array)
        return result 
        
    }catch(err){
        console.log(err)
        throw new Error(err.message)
    }
}

async function scrapeSelectorsIndividually(page, selectors_array){
    
    const result = {}
    
    for(const selectorInfo of selectors_array){
        const {name, format, target, selector} = selectorInfo

        if(format === "array"){
            try{
                result[name] = await page.$$eval(selector,
                    (elements, target)=>elements.map((e)=>{
                        if(e.hasAttribute(target)) return e.getAttribute(target)
                        else if(target === 'innerHTML') return e.innerHTML || 'No Data Found'
                        return e.innerText || 'No Data Found'
                    }), target)
            }catch(err){
                console.log(`Error While evaluating selector with name : ${name}`);
                throw new Error(`Error While evaluating selector with name : ${name}`)
            }
        
        }else{
            try{
                result[name] = await page.$eval(selector, (e, target)=>{
                    if(e.hasAttribute(target)) return e.getAttribute(target)
                    else if(target === 'innerHTML') return e.innerHTML || 'No Data Found'
                    return e.innerText || 'No Data Found'
                }, target)
            }catch(err){
                console.log(`Error While evaluating selector with name : ${name}`);
                throw new Error(`Error While evaluating selector with name : ${name}`)
            }
        }
    }

    return result;
}

function getSelectorsFromTaskResult(task){
    return task.selectors.filter((selector)=>task.result.data.includes(selector.name))
}


async function scrape(task, page){
    

    /* Replace url placeholders with values */
    const url = replaceUrlParams(task)

    console.log('Processing URL:', url,'\n\n');

    if(!url) throw new Error("Something went wrong")

    try{
        /* navigate to url and wait for document to load */
        try{
            await page.goto(url, {waitUntil : 'domcontentloaded'})

        }catch(err){
            console.log(`Error : ${err}`);
            throw new Error(`Couldn't go to page : ${url}`)
        }

        /* only process selectors included in task.result.data */
        task.selectors = getSelectorsFromTaskResult(task)

        let result = {}
        if(task.result.format === 'array'){
                if(task.result.waitForSelector){
                    try{
                        await page.waitForSelector(task.result.waitForSelector,{timeout:3000})  
                    }catch(err){
                        console.log("Page didn't load properly");
                        throw new Error('Page didn\'t load properly')
                    }  
                }else{
                    try{
                        await page.waitForSelector(task.result.parentElementSelector,{timeout:3000})
                    }catch(err){
                        console.log("parentElementSelector Not Found even after 3sec");
                        throw new Error("parentElementSelector Not Found even after 3sec")
                    }
                }
            
            result = await scrapeAllSelectorsTogether(page, task.selectors, task.result.parentElementSelector)
        }else{
            
                if(task.result.waitForSelector){
                    try{
                        await page.waitForSelector(task.result.waitForSelector,{timeout:3000})  
                    }catch(err){
                        console.log("Page didn't load properly");
                        throw new Error('Page didn\'t load properly')
                    }
                }else{
                    try{
                        await page.waitForSelector(task.selectors[0].selector,{timeout:3000})
                    }catch(err){
                        console.log("first selector in selectors array Not Found even after 3sec");
                        throw new Error("first selector in selectors array Not Found even after 3sec")
                    }
                }
            
            result = await scrapeSelectorsIndividually(page, task.selectors)
        }

        return result;

    }catch(err){
        console.log(err)
        throw err
    }
}

async function test_scrape(page, task){
    const {success,message} = test_task(task)

    if(success){
        return await scrape(task, page)
    }else{
        return {success, message};
    }
}

module.exports = test_scrape