let countdown;
const countdownElement = document.getElementById('countdown');
const button = document.getElementById('timerButton');
const alarm = new Audio('alarm.mp3');

button.addEventListener('click', function() {
    clearInterval(countdown);
    var timeLeft = 14;
    alarm.pause();
    alarm.currentTime = 0;
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