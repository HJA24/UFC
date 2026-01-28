export function loadAndPopulateTable(input) {
    d3.json("fights.json")
        .then(data => {
            const tableBody = d3.select('#fight-rows');
            tableBody.html(''); // Clear existing table rows

            const keys = ["blue", "red", "winner", "method", "round", "time", "event", "date"];

            if (typeof input === "string") {
                // === Fighter node hover ===
                const fighterId = input;
                const fighterData = data[fighterId];

                if (!fighterData) {
                    console.warn(`No data found for fighter ID: ${fighterId}`);
                    return;
                }

                Object.values(fighterData).forEach(fights => {
                    if (!Array.isArray(fights)) return;

                    fights.forEach(fight => {
                        const row = tableBody.append('tr');
                        keys.forEach(key => {
                            row.append('td').text(fight[key] || 'N/A');
                        });
                    });
                });

            } else if (input.type === "link") {
                // === Link hover ===
                const { sourceId, targetId } = input;

                let fights = data[sourceId]?.[targetId] || data[targetId]?.[sourceId];

                if (!fights || !Array.isArray(fights)) {
                    console.warn(`No fight data found between ${sourceId} and ${targetId}`);
                    return;
                }

                fights.forEach(fight => {
                    const row = tableBody.append('tr');
                    keys.forEach(key => {
                        row.append('td').text(fight[key] || 'N/A');
                    });
                });
            } else {
                console.error("Unsupported input to loadAndPopulateTable:", input);
            }
        })
        .catch(error => {
            console.error('Error loading the JSON data:', error);
        });
}

export function clearTable() {
    d3.select('#fight-rows').html('');
}
