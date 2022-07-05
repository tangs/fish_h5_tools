exports.getCompoentByType = (comps, type, nodeId, filter) => {
    let name = "";
    for (const comp of comps) {
        const name1 = comp["_name"];
        if (name1 != null && name1 != "") {
            name = name1;
        }
        if (comp["__type__"] === type && (
            nodeId === undefined ||
            name === nodeId ||
            (comp["node"] && comp["node"]["__id__"] == nodeId))) {
            if (filter == null || filter(comp)) {
                return comp;
            }
        }
    }
}