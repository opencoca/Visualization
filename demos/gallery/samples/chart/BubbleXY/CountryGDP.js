import { BubbleXY } from "@hpcc-js/chart";

var w = new BubbleXY()
    .target("target")
    .columns(["Population Growth Per Year (%)", "Adult Obesity (%)", "Country Name", "Population", "Birth Rate (%)", "Death Rate (%)", "GDP PPP (USD)", "Health Expense Per Year (USD)"])
    .data([
        [0.9,33,"United States",316668567,13.66,8.39,15940000000000,2853260000000],
        [0.46,5.7,"China",1349585838,12.25,7.31,12610000000000,643110000000],
        [1.28,1.9,"India",1220800359,20.24,7.39,4761000000000,195200000000],
        [-0.1,5,"Japan",127253075,8.23,9.27,4704000000000,446880000000],
        [-0.19,25.1,"Germany",81147265,8.37,11.17,3250000000000,377000000000],
        [-0.02,26.5,"Russia",142500482,12.11,13.97,2555000000000,130305000000],
        [0.83,18.8,"Brazil",201009622,14.97,6.51,2394000000000,215460000000],
        [0.55,26.9,"United Kingdom",63395574,12.26,9.33,2375000000000,228000000000],
        [0.47,18.2,"France",65951611,12.6,8.96,2291000000000,272629000000],
        [0.34,19.8,"Italy",61482297,8.94,10.01,1863000000000,176985000000],
        [1.07,32.1,"Mexico",116220947,18.61,4.94,1788000000000,112644000000],
        [0.18,7.7,"Korea South",48955203,8.33,6.5,1640000000000,113160000000],
        [0.77,26.2,"Canada",34568211,10.28,8.2,1513000000000,170969000000],
        [0.73,26.6,"Spain",47370542,10.14,8.94,1434000000000,136230000000],
        [0.99,4.8,"Indonesia",251160124,17.38,6.31,1237000000000,32162000000],
        [1.16,27.8,"Turkey",80694485,17.22,6.11,1142000000000,76514000000],
        [1.24,19.4,"Iran",79853900,18.4,5.94,1016000000000,56895999999],
        [1.11,26.8,"Australia",22262501,12.23,7.01,986700000000,85842900000],
        [1.51,33,"Saudi Arabia",26939583,19.01,3.32,921700000000,39633100000]
    ])
    .pointSizeColumn("Population")
    .pointShape("circle")
    .minPointSize(10)
    .maxPointSize(30)
    .render()
    ;
w.tooltipHTML(function(d){
    return w.tooltipKeyValueFormat("Country Name", {
        "Country Name": d.row[2], 
        "Population": d.row[3], 
        "Birth Rate (%)": d.row[4], 
        "Death Rate (%)": d.row[5], 
        "GDP PPP (USD)": d.row[6],
        "Health Expense Per Year (USD)": d.row[7]
    });
})