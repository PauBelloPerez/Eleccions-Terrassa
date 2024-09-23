document.addEventListener('DOMContentLoaded', function () {
    // Variables globales
    let parsedData = [];
    let filteredData = [];
    let resizing = false;
    let lastX, lastY;

    // Colores específicos por partido y año
    const colors = {
        "PSC": "#FF0000",
        "CiU / Junts": {
            "2007": "#18307B",
            "2011": "#18307B",
            "2015": "#18307B",
            "2019": "#00C3B2",
            "2023": "#00C3B2"
        },
        "ERC": "yellow",
        "PP": "#0198CB",
        "ICV / Comuns": {
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
        "Altres": "#676767",
        "PACMA": "#00FF7F",
        "EUiA": "#DF0101",
        "Verds": "#009642",
        "CiU / Junts": "#18307B",
        "ICV / Comuns": "#67AF23"

    };

    function getColor(party, year) {
        if (typeof colors[party] === 'object') {
            return colors[party][year] || "#000000"; // Color por defecto si no se encuentra
        }
        return colors[party];
    }

    // Leer el archivo CSV
    fetch('Municipales2007-2023II.csv')
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
            parties = ['PSC', 'CiU / Junts', 'ERC', 'PP', 'ICV / Comuns', 
                       'Cs', 'CUP', 'PxC', 'En Blanco', 'PRIMARIES', 
                       'TxT', 'VOX', 'Podem', 'PACMA', 'EUiA', 'Verds','Altres',];
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
                    const totalVotes = filtered.reduce((acc, curr) => acc + parseFloat(curr['VOTS_VALIDS'] || 0) + parseFloat(curr['VOTS_BLANCS'] || 0), 0);
                    const participation = (totalVotes / totalElectors) * 100;
                    return totalElectors === 0 ? null : participation.toFixed(2);
                } else {
                    if (selectedDistrict === 'Tots' || selectedSection === 'Totes') {
                        const totalVotes = filtered.reduce((acc, curr) => acc + parseFloat(curr[party] || 0), 0);
                        const totalVotants = filtered.reduce((acc, curr) => acc + parseFloat(curr['VOTS_VALIDS'] || 0), 0);
                        const percentage = totalVotants === 0 ? null : (totalVotes / totalVotants * 100).toFixed(2);
                        return percentage;
                    } else {
                        const sectionData = filtered.find(item => item['Secció'] === selectedSection);
                        if (sectionData) {
                            const percentage = parseFloat(sectionData[`% ${party}`]);
                            return isNaN(percentage) ? null : percentage.toFixed(2);
                        }
                        return null;
                    }
                }
            });
        
            const hasData = data.some(value => value !== null);
        
            if (!hasData) {
                return null;
            }
        
            return {
                label: party,
                data: data,
                borderColor: resultType === 'participacio' ? '#FF8C00' : getColor(party, years[0]),
                backgroundColor: resultType === 'participacio' ? '#FF8C00' : getColor(party, years[0]),
                fill: false,
                pointRadius: function(context) {
                    const value = context.raw;
                    return value === null ? 0 : 3;  // Aumenta el tamaño de los puntos para mayor visibilidad
                },
                pointHoverRadius: 7,  // Aumenta el radio al pasar el mouse por encima
                pointHitRadius: 10,  // Aumenta el área de clic
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const value = tooltipItem.raw;
                            return value === null ? '' : value + '%';  // Mostrar el valor con el símbolo de porcentaje
                        }
                    }
                }
            };
        }).filter(dataset => dataset !== null);
        
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
                        mode: 'nearest',
                        intersect: false,
                        animation: false,  // Desactiva la animación del tooltip para que desaparezca más rápido
                        callbacks: {
                            label: function(tooltipItem) {
                                const value = tooltipItem.raw;
                                return value === null ? '' : value + '%';
                            }
                        }
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: false,
                        animationDuration: 0  // Elimina la animación de hover para mejorar la respuesta
                    },
                    animation: {
                        duration: 0,  // Elimina la animación general del gráfico para que sea más fluido
                    },
                    elements: {
                        point: {
                            radius: 5,
                            hoverRadius: 7,
                            hitRadius: 10
                        },
                        line: {
                            tension: 0
                        }
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
                                    return value + '%';
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
    } else if (selection === 'Parlament') {
        window.location.href = 'GráficosParlament.html';
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
