(() => {
    const yearFilters = document.querySelectorAll(".year-filter select");

    yearFilters.forEach((select) => {
        select.addEventListener("change", () => {
            const form = select.form;
            if (form) {
                form.submit();
            }
        });
    });

    const monthlyDataEl = document.getElementById("monthly-chart-data");
    const quarterlyDataEl = document.getElementById("quarterly-chart-data");
    const yearlyDataEl = document.getElementById("yearly-chart-data");

    if (!monthlyDataEl || !quarterlyDataEl || !yearlyDataEl || !window.Chart) {
        return;
    }

    const monthlyChartData = JSON.parse(monthlyDataEl.textContent);
    const quarterlyChartData = JSON.parse(quarterlyDataEl.textContent);
    const yearlyChartData = JSON.parse(yearlyDataEl.textContent);
    const root = document.documentElement;
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    let charts = [];

    const getStyles = () => getComputedStyle(root);

    const makeGradient = (ctx, topColor, bottomColor) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);
        return gradient;
    };

    const destroyCharts = () => {
        charts.forEach((chart) => chart.destroy());
        charts = [];
    };

    const buildCharts = () => {
        const monthlyCanvas = document.getElementById("monthlyChart");
        const quarterlyCanvas = document.getElementById("quarterlyChart");
        const yearlyCanvas = document.getElementById("yearlyChart");

        if (!monthlyCanvas || !quarterlyCanvas || !yearlyCanvas) {
            return;
        }

        destroyCharts();

        const styles = getStyles();
        const gridColor = styles.getPropertyValue("--hairline-color").trim();
        const tickColor = styles.getPropertyValue("--body-quiet-color").trim();
        const monthlyTop = styles.getPropertyValue("--primary").trim();
        const monthlySoft = styles.getPropertyValue("--selected-bg").trim();
        const quarterlyTop = styles.getPropertyValue("--secondary").trim();
        const quarterlySoft = styles.getPropertyValue("--darkened-bg").trim();
        const yearlyBorder = styles.getPropertyValue("--link-fg").trim();
        const yearlyFill = styles.getPropertyValue("--breadcrumbs-bg").trim();

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: tickColor
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        precision: 0,
                        color: tickColor
                    }
                }
            }
        };

        const monthlyCtx = monthlyCanvas.getContext("2d");
        charts.push(new Chart(monthlyCtx, {
            type: "bar",
            data: {
                labels: monthlyChartData.labels,
                datasets: [{
                    label: "Số",
                    data: monthlyChartData.data,
                    backgroundColor: makeGradient(monthlyCtx, monthlyTop, monthlySoft),
                    borderColor: monthlyTop,
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options
        }));

        const quarterlyCtx = quarterlyCanvas.getContext("2d");
        charts.push(new Chart(quarterlyCtx, {
            type: "bar",
            data: {
                labels: quarterlyChartData.labels,
                datasets: [{
                    label: "Số",
                    data: quarterlyChartData.data,
                    backgroundColor: makeGradient(quarterlyCtx, quarterlyTop, quarterlySoft),
                    borderColor: quarterlyTop,
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options
        }));

        const yearlyCtx = yearlyCanvas.getContext("2d");
        charts.push(new Chart(yearlyCtx, {
            type: "line",
            data: {
                labels: yearlyChartData.labels,
                datasets: [{
                    label: "Số",
                    data: yearlyChartData.data,
                    fill: true,
                    tension: 0.35,
                    borderColor: yearlyBorder,
                    backgroundColor: yearlyFill,
                    pointBackgroundColor: yearlyBorder,
                    pointRadius: 4
                }]
            },
            options
        }));
    };

    buildCharts();

    const rebuildOnThemeChange = () => {
        buildCharts();
    };

    const themeObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.attributeName === "data-theme") {
                rebuildOnThemeChange();
                break;
            }
        }
    });

    themeObserver.observe(root, { attributes: true });
    themeQuery.addEventListener("change", rebuildOnThemeChange);
})();
