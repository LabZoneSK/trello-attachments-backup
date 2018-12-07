const month = new Array()
month[0] = 'January'
month[1] = 'February'
month[2] = 'March'
month[3] = 'April'
month[4] = 'May'
month[5] = 'June'
month[6] = 'July'
month[7] = 'August'
month[8] = 'September'
month[9] = 'October'
month[10] = 'november'
month[11] = 'December'

const getMonthName = (index) => {
  return month[index];
}

const getCurrentMonth = () => {
  const now = new Date();
  return getMonthName(now.getMonth());
}

module.exports = {
  getCurrentMonth
}
