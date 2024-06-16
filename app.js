const button = document.getElementById('startButton');
const alarm = document.getElementById('alarmSound');
let countdown;

button.addEventListener('click', function() {
  clearInterval(countdown);
  alarm.pause();
  alarm.currentTime = 0;
  countdown = setTimeout(() => {
    alarm.play();
  }, 14000);
});