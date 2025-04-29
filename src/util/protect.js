function protect(object, properties) {    
    for (const property of (properties ?? Object.keys(object))) {
        const descriptor = Object.getOwnPropertyDescriptor(object, property);
        if (!descriptor.configurable) continue;
        try {
            const newDescriptor = {
                ...descriptor,
                writable: false,
                enumerable:
                    typeof property === "string" ?
                        property.startsWith("_") ?
                            false : descriptor.enumerable
                        : typeof property === "symbol" ?
                            false : descriptor.enumerable,
                configurable: false
            };
            if (newDescriptor.get || newDescriptor.set) delete newDescriptor.writable;
            Object.defineProperty(object, property, newDescriptor);
        } catch (err) {
            console.error(`Failed to protect ${property} from ${object[Symbol.toStringTag] ?? object.name ?? object}`, err);
        }
    }
}

module.exports = protect;