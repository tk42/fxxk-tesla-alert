let countdown;
const countdownElement = document.getElementById('countdown');
const button = document.getElementById('timerButton');
const alarm = new Audio('alarm.mp3');

alarm.load();

button.addEventListener('click', function() {
    if (countdown) {
        clearInterval(countdown);
        alarm.pause();
        alarm.currentTime = 0;
    }
    var timeLeft = 14;
    countdownElement.textContent = "0:"+timeLeft.toString().padStart(2, '0');
    countdown = setInterval(function() {
        timeLeft -= 1;
        countdownElement.textContent = "0:"+timeLeft.toString().padStart(2, '0');
        if (timeLeft <= 0) {
            clearInterval(countdown);
            alarm.play();
        }
    }, 1000);
});