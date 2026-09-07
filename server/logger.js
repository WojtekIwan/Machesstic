// ***********************************************************************************
//                                     LOGGER
//                    Prints prettier logs (I was really bored)
// ***********************************************************************************

export default class Logger{
    // White bold text 
    title(message){
        console.log("\x1b[1m%s\x1b[0m", `[📢 ] ${message}`)
    }

    // Red text
    error(message){
        console.log("\x1b[31m%s\x1b[0m", `[❌ ] ${message}`)
    }

    // Yellow text
    warning(message){
        console.log("\x1b[33m%s\x1b[0m", `[⚠️ ] ${message}`)
    }

    // Green text
    okay(message){
        console.log("\x1b[32m%s\x1b[0m", `[✅ ] ${message}`)
    }

    // White text
    default_message(message){
        console.log(`[📃 ] ${message}`)
    }

    // White text but with waiting
    wait_message(message){
        console.log(`[⏳ ] ${message}`)
    }
}