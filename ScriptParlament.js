// Definir el mapeo de columnas para cada año
const columnMapping = {
    '2024': {
        partitColumns: ['Junts', 'Cs', 'CUP', 'ERC', 'PACMA', 'PP', 'PSC', 'Comuns','Aliança','VOX', 'Altres'],
        totalVotesColumn: 'VOTS_VALIDS',
        districteColumn: 'Districte',
        seccioColumn: 'Secció'
    },
    '2021': {
        partitColumns: ['Junts', 'Cs', 'CUP', 'ERC', 'PDeCat', 'PP', 'PSC', 'ECP', 'VOX', 'Altres'],
        totalVotesColumn: 'VOTS_VALIDS',
        districteColumn: 'Districte',
        seccioColumn: 'Secció'
    },
    '2017': {
        partitColumns: ['Cs', 'CUP', 'ERC', 'Junts','PP', 'PACMA', 'PSC', 'CECP', 'Altres'],
        totalVotesColumn: 'VOTS_VALIDS',
        districteColumn: 'Districte',
        seccioColumn: 'Secció'
    },
    '2015': {
        partitColumns: ['Cs', 'JxSí', 'UNIO.CAT', 'CUP', 'PP', 'PSC', 'PACMA', 'CSQP', 'Altres'],
        totalVotesColumn: 'VOTS_VALIDS',
        districteColumn: 'Districte',
        seccioColumn: 'Secció'
    },
    '2012': {
        partitColumns: ['CUP', 'CiU', 'Cs', 'PACMA', 'ERC', 'ICV', 'PP', 'PSC', 'PxC', 'Altres'],
        totalVotesColumn: 'VOTS_VALIDS',
        districteColumn: 'Districte',
        seccioColumn: 'Secció'
    },
    '2010': {
        partitColumns: ['Cs', 'CiU', 'SI', 'ERC', 'ICV', 'PP', 'PSC', 'Altres', 'PxC', 'Reagrupament'],
        totalVotesColumn: 'VOTS_VALIDS',
        districteColumn: 'Districte',
        seccioColumn: 'Secció'
    },
    '2006': {
        partitColumns: ['CiU', 'ERC', 'ICV', 'PP', 'PSC','Cs' ,'Altres', 'Verds'],
        totalVotesColumn: 'VOTS_VALIDS',
        districteColumn: 'Districte',
        seccioColumn: 'Secció'
    }
};

// Ejemplo de script para "municipals"


// Esperar a que el contenido de la página se haya cargado
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('any').addEventListener('change', () => {
        console.log('Cambio de año detectado');
        updateDistricteOptions();
    });

    document.getElementById('districte').addEventListener('change', () => {
        console.log('Cambio de distrito detectado');
        updateSeccions();
    });

    document.getElementById('seccio').addEventListener('change', () => {
        console.log('Cambio de sección detectado');
        loadData();
    });

    updateDistricteOptions();
});

document.getElementById('yearToggle').addEventListener('change', () => {
    console.log('Toggle de año cambiado');
});


function aggregateDataByPartit(data, year, districte, seccio) {
    const columns = columnMapping[year];
    const partitMap = new Map();
    let totalVotes = 0;

    // Sumamos los votos totales por fila
    data.forEach(row => {
        const rowTotalVotes = parseInt(row[columns.totalVotesColumn]) || 0;
        totalVotes += rowTotalVotes;
    });

    // Agregamos los votos por partido
    data.forEach(row => {
        columns.partitColumns.forEach(partit => {
            const vots = parseInt(row[partit]) || 0;

            if (!partitMap.has(partit)) {
                partitMap.set(partit, { vots: 0 });
            }

            const currentData = partitMap.get(partit);
            currentData.vots += vots;
        });
    });

    // Calculamos el porcentaje para cada partido en relación al total de votos
    const aggregatedData = Array.from(partitMap, ([partit, { vots }]) => ({
        partit,
        vots,
        percentatge: (vots / totalVotes) * 100
    }));

    // Ordenar los partidos por el total de votos en orden descendente
    aggregatedData.sort((a, b) => b.vots - a.vots);

    

    return aggregatedData;
}



function loadData() {
    const year = document.getElementById('any').value;
    let fileName = '';

    switch (year) {
        case '2024':
            fileName = 'Parlament2024CSV2.csv';
            break;
        case '2021':
            fileName = 'Parlament2021CSV.csv';
            break;
            case '2017':
            fileName = 'Parlament2017CSV2.csv';
            break;
        case '2015':
            fileName = 'Parlament2015CSV.csv';
            break;
        case '2012':
            fileName = 'Parlament2012CSV.csv';
            break;
        case '2010':
            fileName = 'Parlament2010CSV.csv';
            break;
        case '2006':
            fileName = 'Parlament2006CSV.csv';
            break;
        default:
            console.error('Año no válido seleccionado');
            return;
    }

    console.log(`Cargando datos de: ${fileName}`);

    Papa.parse(fileName, {
        download: true,
        delimiter: ';',
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const data = results.data;
            console.log(`Datos cargados para el año ${year}:`, data);
            const districte = document.getElementById('districte').value;
            const seccio = document.getElementById('seccio').value;
            const filteredData = filterData(data, districte, seccio, year);
            console.log('Datos filtrados:', filteredData);
            const aggregatedData = aggregateDataByPartit(filteredData, year, districte, seccio);
            console.log('Datos agregados:', aggregatedData);
            updateTable(aggregatedData);
            updateParticipacio(filteredData, year, districte, seccio);
        },
        error: function(error) {
            console.error('Error cargando el archivo CSV:', error);
        }
    });
}




function filterData(data, districte, seccio, year) {
    const columns = columnMapping[year];
    let filteredData = data;

    if (districte !== 'tots') {
        filteredData = filteredData.filter(row => row[columns.districteColumn] === districte);
    }

    if (seccio !== 'totes') {
        filteredData = filteredData.filter(row => row[columns.seccioColumn] === seccio);
    }

    return filteredData;
}

document.getElementById('lockToggle').addEventListener('change', function() {
    console.log('Toggle de bloqueo activado:', this.checked);
});

function updateDistricteOptions() {
    const year = document.getElementById('any').value;
    const keepSelections = document.getElementById('yearToggle').checked;
    let fileName = '';

    switch (year) {
        case '2024':
            fileName = 'Parlament2024CSV2.csv';
            break;
        case '2021':
            fileName = 'Parlament2021CSV.csv';
            break;
            case '2017':
            fileName = 'Parlament2017CSV2.csv';
            break;
        case '2015':
            fileName = 'Parlament2015CSV.csv';
            break;
        case '2012':
            fileName = 'Parlament2012CSV.csv';
            break;
        case '2010':
            fileName = 'Parlament2010CSV.csv';
            break;
        case '2006':
            fileName = 'Parlament2006CSV.csv';
            break;
        default:
            console.error('Año no válido seleccionado');
            return;
    }

    console.log(`Actualizando opciones de distrito para el año ${year}`);

    Papa.parse(fileName, {
        download: true,
        delimiter: ';',
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const data = results.data;
            const districteOptions = getUniqueDistricte(data, year);
            console.log('Opciones de distrito:', districteOptions);
            // Solo actualizar las opciones de "Districte" y "Secció" si el toggle no está activado
            if (!keepSelections) {
                updateDistricteSelect(districteOptions);
                updateSeccions(); // Actualiza las secciones después de actualizar districte
            } else {
                loadData(); // Si no se actualizan las opciones, solo carga los datos con las selecciones actuales
            }
        },
        error: function(error) {
            console.error('Error cargando el archivo CSV:', error);
        }
    });
}


function getUniqueDistricte(data, year) {
    const columns = columnMapping[year];
    const districteSet = new Set();

    data.forEach(row => {
        if (row[columns.districteColumn]) {
            districteSet.add(row[columns.districteColumn]);
        }
    });

    return Array.from(districteSet).sort((a, b) => a - b).map(String);
}

function updateDistricteSelect(districteOptions) {
    const districteSelect = document.getElementById('districte');
    districteSelect.innerHTML = '<option value="tots">Tots</option>';

    districteOptions.forEach(districte => {
        const option = document.createElement('option');
        option.value = districte;
        option.textContent = districte;
        districteSelect.appendChild(option);
    });
}

function updateSeccions() {
    const districte = document.getElementById('districte').value;
    const year = document.getElementById('any').value;
    let fileName = '';

    switch (year) {
        case '2024':
            fileName = 'Parlament2024CSV2.csv';
            break;
        case '2021':
            fileName = 'Parlament2021CSV.csv';
            break;
            case '2017':
            fileName = 'Parlament2017CSV2.csv';
            break;
        case '2015':
            fileName = 'Parlament2015CSV.csv';
            break;
        case '2012':
            fileName = 'Parlament2012CSV.csv';
            break;
        case '2010':
            fileName = 'Parlament2010CSV.csv';
            break;
        case '2006':
            fileName = 'Parlament2006CSV.csv';
            break;
        default:
            console.error('Año no válido seleccionado');
            return;
    }

    console.log(`Actualizando opciones de sección para el distrito ${districte} y el año ${year}`);

    Papa.parse(fileName, {
        download: true,
        delimiter: ';',
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const data = results.data;
            const seccioOptions = getUniqueSeccio(data, districte, year);
            console.log('Opciones de sección:', seccioOptions);
            updateSeccioSelect(seccioOptions);
            loadData(); // Carga los datos después de actualizar las secciones
        },
        error: function(error) {
            console.error('Error cargando el archivo CSV:', error);
        }
    });
}

function getUniqueSeccio(data, districte, year) {
    const columns = columnMapping[year];
    const seccioSet = new Set();

    data.forEach(row => {
        if ((districte === 'tots' || row[columns.districteColumn] === districte) && row[columns.seccioColumn]) {
            seccioSet.add(row[columns.seccioColumn]);
        }
    });

    return Array.from(seccioSet).sort((a, b) => a - b).map(String);
}

function updateSeccioSelect(seccioOptions) {
    const seccioSelect = document.getElementById('seccio');
    seccioSelect.innerHTML = '<option value="totes">Totes</option>';

    seccioOptions.forEach(seccio => {
        const option = document.createElement('option');
        option.value = seccio;
        option.textContent = seccio;
        seccioSelect.appendChild(option);
    });
}

function aggregateDataByPartit(data, year, districte, seccio) {
    const columns = columnMapping[year];
    const partitMap = new Map();
    let totalVotes = 0;

    // Sumamos los votos totales por fila
    data.forEach(row => {
        const rowTotalVotes = parseInt(row[columns.totalVotesColumn]) || 0;
        totalVotes += rowTotalVotes;
    });

    // Agregamos los votos por partido
    data.forEach(row => {
        columns.partitColumns.forEach(partit => {
            const vots = parseInt(row[partit]) || 0;

            if (!partitMap.has(partit)) {
                partitMap.set(partit, { vots: 0 });
            }

            const currentData = partitMap.get(partit);
            currentData.vots += vots;
        });
    });

    // Calculamos el porcentaje para cada partido en relación al total de votos
    const aggregatedData = Array.from(partitMap, ([partit, { vots }]) => ({
        partit,
        vots,
        percentatge: (vots / totalVotes) * 100
    }));

    

    return aggregatedData;
}



function updateTable(aggregatedData, year) {
    const tableBody = document.querySelector('#resultsTable tbody');
    tableBody.innerHTML = '';

    aggregatedData.sort((a, b) => b.vots - a.vots);

    // Datos para el gráfico
    const labels = aggregatedData.map(row => row.partit);
    const votes = aggregatedData.map(row => row.vots);
    const percentages = aggregatedData.map(row => row.percentatge);

    // Renderizar el gráfico
    renderChart(labels, votes, year);
    renderPieChart(labels, percentages, year);

   

    if (aggregatedData.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.textContent = 'No data available for the selected criteria';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    } else {
        aggregatedData.forEach(row => {
            const tr = document.createElement('tr');
            const partitTd = document.createElement('td');
            const votsTd = document.createElement('td');
            const percentatgeTd = document.createElement('td');

            partitTd.textContent = row.partit;
            votsTd.textContent = row.vots;
            percentatgeTd.textContent = row.percentatge.toFixed(2) + '%';

            // Aplicar clases CSS solo a la celda del partido
            const partyColor = getPartyColor(row.partit, year);
            if (partyColor) {
                partitTd.style.backgroundColor = partyColor;
                partitTd.style.color = 'white'; // Asegúrate de que el texto sea legible
            }

            tr.appendChild(partitTd);
            tr.appendChild(votsTd);
            tr.appendChild(percentatgeTd);
            tableBody.appendChild(tr);
        });
    }
}


function renderChart(labels, votes, year) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    const chart = Chart.getChart(ctx);

    if (chart) {
        chart.destroy();
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vots',
                data: votes,
                backgroundColor: labels.map(label => getPartyColor(label, year)),
                borderColor: 'black',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw} votes`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}
function renderPieChart(labels, percentages, year) {
    const ctx = document.getElementById('resultsPieChart').getContext('2d');
    const chart = Chart.getChart(ctx);

    if (chart) {
        chart.destroy();
    }

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribución de Vots',
                data: percentages,
                backgroundColor: labels.map(label => getPartyColor(label, year)),
                borderColor: 'black',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 20,
                        padding: 10,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw.toFixed(2)}%`;
                        }
                    }
                }
            }
        }
    });
}

function updateParticipacio(data, year, districte, seccio) {
    const mapping = columnMapping[year];

    let participationPercentage = 0;

    if (districte === 'tots' && seccio === 'totes') {
        // Cálculo global para todos los distritos y secciones
        let totalVotsCandidats = 0;
        let totalVotsBlancs = 0;
        let totalElectors = 0;
        let totalVotants = 0;
        let totalCenso = 0;

        data.forEach(row => {
            if (year === '2023') {
                const votants = parseInt(row['Votants'], 10) || 0;
                const censo = parseInt(row['Censo'], 10) || 0;
                totalVotants += votants;
                totalCenso += censo;
            } else {
                const votsCandidats = parseInt(row[mapping.totalVotesColumn], 10) || 0;
                const votsBlancs = parseInt(row['VOTS_BLANCS'], 10) || 0;
                const electors = parseInt(row['NUM_ELECTORS'], 10) || 0;
                totalVotsCandidats += votsCandidats;
                totalVotsBlancs += votsBlancs;
                totalElectors += electors;
            }
        });

        if (year === '2023') {
            if (totalCenso > 0) {
                participationPercentage = (totalVotants / totalCenso) * 100;
            }
        } else {
            if (totalElectors > 0) {
                participationPercentage = ((totalVotsCandidats + totalVotsBlancs) / totalElectors) * 100;
            }
        }
    } else if (districte !== 'tots') {
        // Cálculo para un distrito específico, con todas las secciones
        let totalVotsCandidats = 0;
        let totalVotsBlancs = 0;
        let totalElectors = 0;
        let totalVotants = 0;
        let totalCenso = 0;

        data.forEach(row => {
            if (row[mapping.districteColumn] === districte) {
                if (year === '2023') {
                    const votants = parseInt(row['Votants'], 10) || 0;
                    const censo = parseInt(row['Censo'], 10) || 0;
                    totalVotants += votants;
                    totalCenso += censo;
                } else {
                    const votsCandidats = parseInt(row[mapping.totalVotesColumn], 10) || 0;
                    const votsBlancs = parseInt(row['VOTS_BLANCS'], 10) || 0;
                    const electors = parseInt(row['NUM_ELECTORS'], 10) || 0;
                    totalVotsCandidats += votsCandidats;
                    totalVotsBlancs += votsBlancs;
                    totalElectors += electors;
                }
            }
        });

        if (year === '2023') {
            if (totalCenso > 0) {
                participationPercentage = (totalVotants / totalCenso) * 100;
            }
        } else {
            if (totalElectors > 0) {
                participationPercentage = ((totalVotsCandidats + totalVotsBlancs) / totalElectors) * 100;
            }
        }
    } else {
        // Cálculo para un distrito y una sección específica
        let totalVots = 0;
        let totalElectors = 0;
        let totalVotants = 0;
        let totalCenso = 0;

        data.forEach(row => {
            if (row[mapping.districteColumn] === districte && row[mapping.seccioColumn] === seccio) {
                if (year === '2023') {
                    const votants = parseInt(row['Votants'], 10) || 0;
                    const censo = parseInt(row['Censo'], 10) || 0;
                    totalVotants += votants;
                    totalCenso += censo;
                } else {
                    const votsCandidats = parseInt(row[mapping.totalVotesColumn], 10) || 0;
                    const votsBlancs = parseInt(row['VOTS_BLANCS'], 10) || 0;
                    const electors = parseInt(row['NUM_ELECTORS'], 10) || 0;
                    totalVots += (votsCandidats + votsBlancs);
                    totalElectors += electors;
                }
            }
        });

        if (year === '2023') {
            if (totalCenso > 0) {
                participationPercentage = (totalVotants / totalCenso) * 100;
            }
        } else {
            if (totalElectors > 0) {
                participationPercentage = (totalVots / totalElectors) * 100;
            }
        }
    }

    // Actualizar la celda de participación
    document.getElementById('participacioValue').textContent = participationPercentage.toFixed(2) + '%';
}

document.getElementById('elecció').addEventListener('change', function() {
    const selection = this.value;

    // Guarda el estado actual del modo oscuro en localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');

    if (selection === 'Municipals') {
        window.location.href = 'Selecciones.html?eleccio=Municipals';
    } else if (selection === 'Generals') {
        window.location.href = 'SeleccionesGenerales.html?eleccio=Generals';
    } else if(selection === 'Parlament') {
        window.location.href = 'SeleccionesParlament.html?eleccio=Parlament';
    }
    // Agrega más condiciones si tienes más elecciones y páginas HTML correspondientes
});



function getPartyColor(party) {
    const colorMap = {
        '2023': {
            'PSC': 'brown',
            'ERC': 'yellow',
            'Junts': '#00C3B2',
            'VOX': '#63BE21',
            'CUP': '#FFEF01',
            'Comuns': '#6e236e',
            'Cs': 'orangered',
            'PP': '#0198CB',
            'PACMA': '#00FF7F',
            'TxT': '#1f1d1d',
            // Agrega colores para otros partidos según sea necesario
            // ...
        },
        '2019': {
            'PSC': '#FF0000',
            'ERC': 'yellow',
            'Junts': '#00C3B2',
            'Podem': '#6e236e',
            'TEC': '#6e236e',
            'CUP': '#FFEF01',
            'VOX': '#63BE21',
            'PP': '#0198CB',
            'PRIMARIES': '#EC4C5E',
            'Cs': 'orangered',
            'TxT': '#1f1d1d',
            'Altres': '#676767'
            // Agrega colores para otros partidos según sea necesario
            // ...
        },
        '2015': {
            'PSC': '#FF0000',
            'ERC': 'yellow',
            'CiU': '#18307B',
            'CUP': '#FFEF01',
            'En Comú': '#D42B16',
            'TEC': '#D00B27',
            'Cs': 'orangered',
            'PP': '#0198CB',
            'PxC': '#045FB4',
            // Agrega colores para otros partidos según sea necesario
            // ...
        },
        '2011': {
            'PSC': '#FF0000',
            'ERC': 'yellow',
            'CiU': '#18307B',
            'ICV': '#67AF23',
            'CUP': '#FFEF01',
            'Cs': 'orangered',
            'PP': '#0198CB',
            'PxC': '#045FB4',
            'En Blanco': '#000000',
            'Blanco': '#000000',
            // Agrega colores para otros partidos según sea necesario
            // ...
        },
        '2007': {
            'PSC': '#FF0000',
            'ERC': 'yellow',
            'CIU': '#18307B',
            'CUP': '#FFEF01',
            'ICV': '#67AF23',
            'Cs': 'orangered',
            'PP': '#0198CB',
            // Agrega colores para otros partidos según sea necesario
            // ...
        }
    };

    return colorMap[year][party] || 'gray'; // Color por defecto si el partido no está en el mapa
}


function getPartyColor(party) {
    const colorMap = {
        'PSC': '#FF0000',
        'ERC': 'yellow',
        'Junts': '#00C3B2',
        'VOX': '#63BE21',
        'CUP': '#FFEF01',
        'Comuns': '#6e236e',
        'ECP': '#6e236e',
        'Podem': '#672f6c',
        'Cs': 'orangered',
        'PP': '#0198CB',
        'Aliança': '#064A81',
        'PACMA': '#00FF7F',
        'TxT': '#1f1d1d',
        'TEC': '#D42B16',
        'CECP': '#912C45',
        'PxC': '#045FB4',
        'En Comú': '#D42B16',
        'CSQP': '#C3113B',
        'En Blanco': '#000000',
        'Blanco': '#000000',
        'CIU': '#18307B',
        'CiU': '#18307B',
        'ICV': '#67AF23',
        'PRIMARIES': '#EC4C5E',
        'JxSí': '#3AB6A5',
        'UNIO.CAT': '#0033A9',
        'SI': '#000000',
        'Verds': '#009642',
        'Altres': '#676767'

        // Agrega colores para otros partidos según sea necesario
        // ...
    };
    return colorMap[party] || 'gray'; // Color por defecto si el partido no está en el mapa
}

function getPartyClass(partit, year) {
    const partyClasses = {
        '2023': {
            'PSC': 'green',
            'ERC': 'erc',
            'Junts': 'junts',
            'VOX': 'vox',
            'CUP': 'cup',
            'Comuns': 'comuns',
            'Cs': 'cs',
            'PP': 'pp',
            'PACMA': 'pacma',
            'TxT': 'txt'
        },
        '2019': {
            'PSC': 'psc-bar',
            'ERC': 'erc-bar',
            'Junts': 'junts-bar',
            'Podem': 'comuns-bar',
            'CECP': 'encomu-bar',
            'CUP': 'cup-bar',
            'VOX': 'vox-bar',
            'PP': 'pp-bar',
            'PRIMARIES': 'primaries-bar',
            'Cs': 'cs-bar',
            'TxT': 'txt-bar'
        },
        '2015': {
            'PSC': 'psc',
            'ERC': 'erc',
            'CiU': 'ciu',
            'CUP': 'cup',
            'En Comú': 'encomu',
            'TEC': 'tec',
            'Cs': 'cs',
            'PP': 'pp',
            'PxC': 'pxc'
        },
        '2011': {
            'PSC': 'psc',
            'ERC': 'erc',
            'CiU': 'ciu',
            'ICV': 'icv',
            'CUP': 'cup',
            'Cs': 'cs',
            'PP': 'pp',
            'PxC': 'pxc',
            'En Blanco': 'enblanco',
            'Blanco': 'blanco'
        },
        '2007': {
            'PSC': 'psc',
            'ERC': 'erc',
            'CIU': 'ciu2007',
            'CUP': 'cup',
            'ICV': 'icv',
            'Cs': 'cs',
            'PP': 'pp'
        }
    };

    return partyClasses[year] ? partyClasses[year][partit] : null;
}
