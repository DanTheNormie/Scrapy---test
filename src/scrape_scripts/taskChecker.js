
function taskIsValid(task) {
    if (!task || typeof task !== 'object') {
        return 'Invalid task object';
    }

    if (!task.url || typeof task.url !== 'string') {
        return 'Invalid or missing "url" in task';
    }

    const requiredParams = task.url.match(/{{(.*?)}}/g) || [];
    for (const requiredParam of requiredParams) {
        const paramName = requiredParam.replace(/{{|}}/g, '');
        if (!task.params || !task.params[paramName]) {
            return `Required parameter "${paramName}" not provided for URL: ${task.url}`;
        }
    }

    for (const paramName in task.params) {
        if (task.params.hasOwnProperty(paramName)) {
            if (!requiredParams.includes(`{{${paramName}}}`)) {
                return `Parameter "${paramName}" in "params" is not used in the URL: ${task.url}`;
            }
        }
    }

    if (!Array.isArray(task.selectors) || task.selectors.length === 0) {
        return 'Invalid or missing "selectors" in task';
    }

    for (const selectorInfo of task.selectors) {
        if (!selectorInfo) {
            return 'Each selector must be a non-empty object';
        }

        if (typeof selectorInfo !== 'object') {
            return 'Each selector must be an object';
        }

        if (!selectorInfo.name || typeof selectorInfo.name !== 'string') {
            return 'Each selector must have a non-empty "name" attribute of type string';
        }

        if (!selectorInfo.selector || typeof selectorInfo.selector !== 'string') {
            return 'Each selector must have a non-empty "selector" attribute of type string';
        }

        if (!selectorInfo.format || typeof selectorInfo.format !== 'string') {
            return 'Each selector must have a non-empty "format" attribute of type string';
        }

        if (!selectorInfo.target || typeof selectorInfo.target !== 'string') {
            return 'Each selector must have a non-empty "target" attribute of type string';
        }
    }

    outerloop:
    for (const data of task.result.data) {
        for (const selectorInfo of task.selectors) {
            if (selectorInfo.name === data) {
                break outerloop;
            }
        }
        return 'Selector information not found for data item in task.result.data';
    }

    if (!task.result.data) {
        return 'Invalid or missing "format.data" in task.result';
    }

    if (task.result.format === 'array') {
        for (const selectorInfo of task.selectors) {
            if (selectorInfo.format === 'single') {
                return 'Invalid "result.format", one or many selectors have format of type "single"';
            }
        }
    }

    if(task.result.format === 'array' && (!task.result.parentElementSelector || typeof task.result.parentElementSelector !== 'string')){
        return 'Invalid or misssing result.parentElementSelector'
    }

    if (task.result.format !== 'single' && task.result.format !== 'array') {
        return 'Invalid "result" in task format, it should be either "single" or "array"';
    }

    if (task.result.format === 'array' && !task.result.data) {
        return 'Invalid or missing "data" in task format for "array" result';
    }

    return true;
}

function taskIsValid2(task) {
    if (!task || typeof task !== 'object') {
        return { success: false, message: 'Invalid task object : correct format is {task : <your_task>}' };
    }

    if (!task.url || typeof task.url !== 'string') {
        return { success: false, message: 'Invalid or missing "url" in task' };
    }

    const requiredParams = task.url.match(/{{(.*?)}}/g) || [];
    for (const requiredParam of requiredParams) {
        const paramName = requiredParam.replace(/{{|}}/g, '');
        if (!task.params || !task.params[paramName]) {
            return { success: false, message: `Required parameter "${paramName}" not provided for URL: ${task.url}` };
        }
    }

    for (const paramName in task.params) {
        if (task.params.hasOwnProperty(paramName)) {
            if (!requiredParams.includes(`{{${paramName}}}`)) {
                console.log( { success: false, message: `Parameter "${paramName}" in "params" is not used in the URL: ${task.url}` })

            }
        }
    }

    if (!Array.isArray(task.selectors) || task.selectors.length === 0) {
        return { success: false, message: 'Invalid or missing "selectors" in task' };
    }

    for (const selectorInfo of task.selectors) {
        if (!selectorInfo) {
            return { success: false, message: 'Each selector must be a non-empty object' };
        }

        if (typeof selectorInfo !== 'object') {
            return { success: false, message: 'Each selector must be an object' };
        }

        if (!selectorInfo.name || typeof selectorInfo.name !== 'string') {
            return { success: false, message: 'Selectors must have a non-empty "name" attribute of type string' };
        }

        if (!selectorInfo.selector || typeof selectorInfo.selector !== 'string') {
            return { success: false, message: `Selector with {name:${selectorInfo.name}} must have a non-empty "selector" attribute of type string` };
        }

        if (!selectorInfo.format || typeof selectorInfo.format !== 'string') {
            return { success: false, message: `Selector with {name:${selectorInfo.name}} must have a non-empty "format" attribute of type string` };
        }

        if (!selectorInfo.target || typeof selectorInfo.target !== 'string') {
            return { success: false, message: `Selector with {name:${selectorInfo.name}} must have a non-empty "target" attribute of type string` };
        }
    }

    outerloop:
    for (const data of task.result.data) {
        for (const selectorInfo of task.selectors) {
            if (selectorInfo.name === data) {
                break outerloop;
            }
        }
        return { success: false, message: 'Selector information not found for data item in task.result.data' };
    }

    if (!task.result.data) {
        return { success: false, message: 'Invalid or missing "format.data" in task.result' };
    }

    if (task.result.format === 'array') {
        for (const selectorInfo of task.selectors) {
            if (selectorInfo.format === 'single') {
                return { success: false, message: `Invalid "result.format" for selector with name : "${selectorInfo.name}", one or many selectors have format of type "single" while "result.format" is "array"` };
            }
        }
    }

    if (task.result.format === 'array' && (!task.result.parentElementSelector || typeof task.result.parentElementSelector !== 'string')) {
        return { success: false, message: 'Invalid or missing result.parentElementSelector' };
    }

    if (task.result.format !== 'single' && task.result.format !== 'array') {
        return { success: false, message: 'Invalid "result" in task format, it should be either "single" or "array"' };
    }

    if (task.result.format === 'array' && !task.result.data) {
        return { success: false, message: 'Invalid or missing "data" in task format for "array" result' };
    }

    return { success: true, message: 'Task format is A-Okay' };
}

//console.log(taskIsValid2(require('../../tasks/1337x/torrent_details_1337x.task.json')))

module.exports = taskIsValid2