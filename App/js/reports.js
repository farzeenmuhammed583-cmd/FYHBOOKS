let salesChartInstance = null;
let financeDonutChartInstance = null;
let financeTrendChartInstance = null;

function renderReports(){

let transactions=getTransactions();

let sales=0;
let expenses=0;

transactions.forEach(t=>{

if(t.type==="credit"){
sales+=t.amount;
}

if(t.type==="debit"){
expenses+=t.amount;
}

});

let ctx=document.getElementById("salesChart");

if(!ctx) return;

if(salesChartInstance){
salesChartInstance.destroy();
}

salesChartInstance = new Chart(ctx,{

type:"bar",

data:{

labels:["Sales","Expenses"],

datasets:[{

label:"KHATA Financial Report",

data:[sales,expenses],

backgroundColor:[

"#3B82F6",
"#8B5CF6"

]

}],

borderRadius:8

},

options:{
responsive:true,
plugins:{
legend:{
labels:{color:"#ffffff"}
}
},
scales:{
y:{
ticks:{color:"#aaa"},
grid:{color:"rgba(31,42,68,0.9)"}
},
x:{
ticks:{color:"#aaa"},
grid:{display:false}
}
}

}

});

}

function getFinanceDistributionData(){

let companies=getStores();
let expenses=getExpenses();
let totalSales=0;

companies.forEach(company=>{
if(company.transactions){
company.transactions.forEach(txn=>{
totalSales += Number(txn.amount || 0);
});
}
});

let totalExpenses = expenses.reduce((sum,e)=> sum + Number(e.amount || 0),0);

return {
sales: totalSales,
expenses: totalExpenses
};

}

function renderFinanceDonutChart(){

let ctx=document.getElementById("financeDonutChart");

if(!ctx) return;

let totals = getFinanceDistributionData();

if(financeDonutChartInstance){
financeDonutChartInstance.destroy();
}

financeDonutChartInstance = new Chart(ctx,{
type:"doughnut",
data:{
labels:["Sales","Expenses"],
datasets:[{
data:[totals.sales,totals.expenses],
backgroundColor:[
"#3b82f6",
"#ef4444"
],
borderWidth:0
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{
position:"bottom",
labels:{
color:"#ffffff"
}
}
}
}
});

}

function getFinanceTrendData(){

let companies = getStores();
let expenses = getExpenses();
let revenueMap = {};
let expenseMap = {};
let revenueData = [];
let expenseData = [];
let labels = [];

companies.forEach(company=>{
if(!company.transactions) return;

company.transactions.forEach(txn=>{
const rawDate = txn.date;
if(!rawDate || typeof rawDate !== "string") return;

const date = rawDate.split("T")[0];
const amount = Number(txn.amount || 0);

if(!revenueMap[date]) revenueMap[date] = 0;
revenueMap[date] += amount;
});
});

expenses.forEach(exp=>{
const rawDate = exp.date;
if(!rawDate || typeof rawDate !== "string") return;

const date = rawDate.split("T")[0];
const amount = Number(exp.amount || 0);

if(!expenseMap[date]) expenseMap[date] = 0;
expenseMap[date] += amount;
});

let allDates = new Set([
...Object.keys(revenueMap),
...Object.keys(expenseMap)
]);

let sortedDates = Array.from(allDates).sort((a,b)=>new Date(a)-new Date(b));

sortedDates.forEach(date=>{
labels.push(date);
revenueData.push(revenueMap[date] || 0);
expenseData.push(expenseMap[date] || 0);
});

return {
labels,
revenueData,
expenseData
};

}

function renderFinanceTrendChart(){

let ctx=document.getElementById("financeTrendChart");

if(!ctx) return;

let trendData = getFinanceTrendData();

if(financeTrendChartInstance){
financeTrendChartInstance.destroy();
}

financeTrendChartInstance = new Chart(ctx,{
type:"line",
data:{
labels:trendData.labels,
datasets:[
{
label:"Revenue",
data:trendData.revenueData,
borderColor:"#00ffd0",
backgroundColor:"rgba(0,255,200,0.15)",
tension:0.4,
fill:true,
pointRadius:4
},
{
label:"Expenses",
data:trendData.expenseData,
borderColor:"#ff4d4f",
backgroundColor:"rgba(255,77,79,0.15)",
tension:0.4,
fill:true,
pointRadius:4
}
]
},
options:{
responsive:true,
plugins:{
legend:{
labels:{color:"#ffffff"}
}
},
scales:{
x:{
ticks:{color:"#aaa"},
grid:{color:"rgba(255,255,255,0.05)"}
},
y:{
ticks:{color:"#aaa"},
grid:{color:"rgba(255,255,255,0.05)"}
}
}
}
});

}

document.addEventListener(
"DOMContentLoaded",
()=>{
renderReports();
renderFinanceDonutChart();
renderFinanceTrendChart();
}
);
