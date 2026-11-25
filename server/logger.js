// +---------------------------------------------------------------------------------+
// |                                    LOGGER                                       |
// |                    Prints prettier logs (I was really bored)                    |
// +---------------------------------------------------------------------------------+

export default class Logger{
    
    title(message){ console.log("\x1b[1m%s\x1b[0m", `[ 📢 ] ${message}`) } // White bold text 

    error(message){ console.log("\x1b[31m%s\x1b[0m", `[ ❌ ] ${message}`) } // Red text

    warning(message){ console.log("\x1b[33m%s\x1b[0m", `[ ⚠️ ] ${message}`) } // Yellow text

    okay(message){ console.log("\x1b[32m%s\x1b[0m", `[ ✅ ] ${message}`) } // Green text

    default_message(message){ console.log(`[ 📃 ] ${message}`) } // White text

    wait_message(message){ console.log(`[ ⏳ ] ${message}`) } // White text but with waiting
}