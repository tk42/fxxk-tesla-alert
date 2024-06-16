const button = document.getElementById('countdownButton');
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