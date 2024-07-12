
// document.addEventListener('DOMContentLoaded', function() {
//     document.getElementById('limitInput').addEventListener('keypress', function(event) {
//         // Optional: Allow only numeric input
//         if (event.which < 48 || event.which > 57) {
//             event.preventDefault();
//         }
//     });

//     document.querySelector('button').addEventListener('click', function() {
//         updateLimit();
//     });
// });

// function updateLimit() {
//     const limit = document.getElementById('limitInput').value;
//     if (limit) {
//         // Assuming you're using chrome.storage to save the limit for use in content scripts or elsewhere
//         chrome.storage.local.set({ 'limit': limit }, function() {
//             console.log('Limit is set to ' + limit);
//         });
//     } else {
//         console.log('No limit entered');
//     }
// }