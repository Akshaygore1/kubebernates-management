exports.convertMinutesToReadable = function convertMinutesToReadable(
  ageInMilliseconds
) {
  const minutes = ageInMilliseconds / 1000 / 60;
  const totalMinutes = Math.floor(minutes);

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const remainingMinutes = Math.floor(totalMinutes % 60);

  return `${days} days, ${hours} hours, ${remainingMinutes} minutes`;
};

exports.getPodName = function getPodName(pod) {
  console.log("pod", pod);
  if (pod) {
    let nameArr = pod.split("-");
    console.log("nameArr");
    let name = nameArr[0] + "-" + nameArr[1];
    console.log("Name", name);
    return `${nameArr[0] + "-" + nameArr[1]}`;
  }
};
