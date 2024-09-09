document.addEventListener('DOMContentLoaded', function () {
    // Variables globales
    let parsedData = [];
    let filteredData = [];
    let resizing = false;
    let lastX, lastY;

    // Colores específicos por partido y año
    const colors = {
        "PSC": "#FF0000",
        "Convergència / Junts": {
            "2007": "#18307B",
            "2011": "#18307B",
            "2015": "#18307B",
            "2019": "#00C3B2",
            "2023": "#00C3B2"
        },
        "ERC": "yellow",
        "PP": "#0198CB",
        "Comuns / Sumar": {
            "2007": "#67AF23",
            "2011": "#67AF23",
            "2015": "#D00B27",
            "2019": "#D00B27",
            "2023": "#6e236e"
        },
        "Cs": "orangered",
        "CUP": "#FFEF01",
        "PxC": "#045FB4",
        "En Blanco": "#000000",
        "PRIMARIES": "#EC4C5E",
        "TxT": "#1f1d1d",
        "VOX": "#63BE21",
        "Podem": "#6e236e",
        "Podemos": "#6e236e",
        "Altres": "#676767",
        "Unió" : "#0033A9",
        "PACMA": "#00FF7F",
        "Más País": "#14DCC5",
        "Front Republicà": "#0A0A0A",
        "UPYD": "#E9008C",
        "Pirata": "#464646",
        "En Blanc": "#000000"
    };

    function getColor(party, year) {
        if (typeof colors[party] === 'object') {
            return colors[party][year] || "#000000"; // Color por defecto si no se encuentra
        }
        return colors[party];
    }

    // Leer el archivo CSV
    fetch('Generals2015-2023II.csv')
        .then(response => response.text())
        .then(data => {
            parsedData = Papa.parse(data, {
                header: true,
                skipEmptyLines: true,
            }).data;

            // Cargar distritos
            loadDistricts();

            // Crear la gráfica inicial
            updateChart();
        })
        .catch(error => console.error('Error al leer el archivo CSV:', error));

    // Actualizar distritos
    function loadDistricts() {
        const districtSelect = document.getElementById('district');
        const districts = [...new Set(parsedData.map(item => item['Districte']))];
        
        // Agregar opciones de distrito
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.text = district;
            districtSelect.appendChild(option);
        });

        districtSelect.addEventListener('change', loadSections);
    }

    // Actualizar secciones según el distrito seleccionado
    function loadSections() {
        const districtSelect = document.getElementById('district');
        const sectionSelect = document.getElementById('section');
        const selectedDistrict = districtSelect.value;

        // Limpiar secciones anteriores
        sectionSelect.innerHTML = '<option value="Totes">Totes</option>';

        // Filtrar las secciones por el distrito seleccionado
        const sections = [...new Set(parsedData
            .filter(item => item['Districte'] === selectedDistrict)
            .map(item => item['Secció']))];

        // Agregar opciones de secciones
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.text = section;
            sectionSelect.appendChild(option);
        });

        updateChart();
    }

    // Actualizar la gráfica según las selecciones
    function updateChart() {
        const resultType = document.getElementById('resultType').value;
        const electionType = document.getElementById('electionType').value;
        const selectedDistrict = document.getElementById('district').value;
        const selectedSection = document.getElementById('section').value;
    
        // Filtrar los datos según el tipo de elección, distrito, y sección
        filteredData = parsedData.filter(item => {
            const isTypeMatch = item['Elecció'] === electionType;
            const isDistrictMatch = selectedDistrict === 'Tots' || item['Districte'] === selectedDistrict;
            const isSectionMatch = selectedSection === 'Totes' || item['Secció'] === selectedSection;
            return isTypeMatch && isDistrictMatch && isSectionMatch;
        });
    
        const years = [...new Set(filteredData.map(item => item['Any']))];
    
        let parties = [];
        let resultLabel = '';
    
        if (resultType === 'resultatsPartits') {
            parties = ['PSC', 'Convergència / Junts', 'ERC', 'PP', 'Comuns / Sumar', 
                       'Cs', 'VOX', 'Podemos', 'CUP' ,'Más País','PACMA','Unió','Front Republicà','Altres', 'En Blanc', 'PxC', 'Pirata', 'UPYD'];
            resultLabel = 'Evolución del Porcentaje de Votos por Partido (2007-2023)';
        } else if (resultType === 'participacio') {
            parties = ['Participació'];
            resultLabel = 'Evolución de la Participación (2007-2023)';
        }
    
        // Crear los datos para los partidos activos
        const partyData = parties.map(party => {
            const data = years.map(year => {
                const filtered = filteredData.filter(item => item['Any'] == year);
    
                if (resultType === 'participacio') {
                    const totalElectors = filtered.reduce((acc, curr) => acc + parseFloat(curr['NUM_ELECTORS'] || 0), 0);
                    const totalVotes = filtered.reduce((acc, curr) => acc + parseFloat(curr['VOTS_CANDIDATURES'] || 0) + parseFloat(curr['VOTS_BLANCS'] || 0), 0);
                    const participation = (totalVotes / totalElectors) * 100; // Multiplicado por 100
                    return totalElectors === 0 ? null : participation.toFixed(2); // Convertir a porcentaje o null si no hay electores
                } else {
                    if (selectedDistrict === 'Tots' || selectedSection === 'Totes') {
                        // Calcular el porcentaje de votos para el partido en lugar de usar el porcentaje del CSV
                        const totalVotes = filtered.reduce((acc, curr) => acc + parseFloat(curr[party] || 0), 0);
                        const totalVotants = filtered.reduce((acc, curr) => acc + parseFloat(curr['NUM_VOTANTS'] || 0), 0);
                        const percentage = totalVotants === 0 ? null : (totalVotes / totalVotants * 100).toFixed(2);
                        return percentage;
                    } else {
                        // Usar el porcentaje del CSV cuando se selecciona una sección específica
                        const sectionData = filtered.find(item => item['Secció'] === selectedSection);
                        if (sectionData) {
                            const percentage = parseFloat(sectionData[`% ${party}`]);
                            return isNaN(percentage) ? null : percentage.toFixed(2);
                        }
                        return null;
                    }
                }
            });
    
            // Verificar si el partido tiene datos válidos en al menos un año
            const hasData = data.some(value => value !== null);
    
            if (!hasData) {
                return null; // Excluir el partido si no tiene datos válidos
            }
    
            return {
                label: party,
                data: data,
                borderColor: resultType === 'participacio' ? '#FF8C00' : getColor(party, years[0]),
                backgroundColor: resultType === 'participacio' ? '#FF8C00' : getColor(party, years[0]),
                fill: false,
                pointRadius: function(context) {
                    // Ocultar puntos cuando no hay valor
                    const value = context.raw;
                    return value === null ? 0 : 3;
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const value = tooltipItem.raw;
                            return value === null ? '' : value + '%';
                        }
                    }
                }
            };
        }).filter(dataset => dataset !== null); // Filtrar los partidos excluidos
    
        // Crear o actualizar la gráfica
        const ctx = document.getElementById('lineChart').getContext('2d');
        if (window.myLineChart) {
            window.myLineChart.data.labels = years;
            window.myLineChart.data.datasets = partyData;
            window.myLineChart.update();
        } else {
            window.myLineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: partyData
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: resultLabel
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false,
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Any'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Percentatge de vot (%)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%'; // Agregar el símbolo de porcentaje
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Event listeners para actualizar la gráfica cuando se cambien las opciones
    document.getElementById('resultType').addEventListener('change', updateChart);
    document.getElementById('electionType').addEventListener('change', updateChart);
    document.getElementById('district').addEventListener('change', updateChart);
    document.getElementById('section').addEventListener('change', updateChart);

    // Funcionalidad de redimensionamiento
    const chartContainer = document.getElementById('chartContainer');
    const resizeHandle = document.querySelector('.resize-handle');

    resizeHandle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        resizing = true;
        lastX = e.clientX;
        lastY = e.clientY;

        function resize(e) {
            if (resizing) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                
                const newWidth = chartContainer.clientWidth + dx;
                const newHeight = chartContainer.clientHeight + dy;
                
                chartContainer.style.width = newWidth + 'px';
                chartContainer.style.height = newHeight + 'px';

                // Redibujar el gráfico para ajustar al nuevo tamaño
                if (window.myLineChart) {
                    window.myLineChart.resize();
                }
            }
        }

        function stopResize() {
            resizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    });
});

document.getElementById('electionType').addEventListener('change', function() {
    const selection = this.value;
    console.log('Selección:', selection);

    // Guardar la selección en localStorage
    localStorage.setItem('electionType', selection);

    if (selection === 'Generals') {
        window.location.href = 'GráficosGenerales.html';
    } else if (selection === 'Municipals') {
        window.location.href = 'Gráficos.html';
    } else if (selection === 'Europees') {
        window.location.href = 'GráficosEuropeas.html';
    } else {
        console.warn('Selección no manejada:', selection);
    }
});

// Al cargar la página, establecer el valor del select en función de localStorage
window.onload = function() {
    // Verifica y aplica el modo oscuro desde localStorage
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeSwitch').textContent = 'Modo claro';
    }

    // Resto de tu código onload
    const savedElectionType = localStorage.getItem('electionType');
    if (savedElectionType) {
        document.getElementById('electionType').value = savedElectionType;
    }
};

