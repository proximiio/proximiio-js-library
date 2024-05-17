import { InjectCSS, calculateDimensions } from '../../common';
import { SortedPoiItemModel } from '../../models/sortedPoiItemModel';
import { compareResults } from './comparator';

interface Options {
  gVisionApiKey: string;
  pois: SortedPoiItemModel[];
  cameraText?: string;
  captureButtonText?: string;
  closeButtonText?: string;
  tryAgainButtonText?: string;
  confirmButtonText?: string;
  noResultsText?: string;
  resultsHeadingText?: string;
  returnResults?: number;
  brandColor?: string; // hsl values
  dir?: string;
}

const defaultConstraints = {
  video: {
    width: {
      min: 1280,
      ideal: 1920,
      max: 2560,
    },
    height: {
      min: 720,
      ideal: 1080,
      max: 1440,
    },
    facingMode: 'environment',
  },
};

class ImageDetection {
  static init(options: Options, onSelect: (item: SortedPoiItemModel) => void) {
    let output = [];
    let selectedOutput: SortedPoiItemModel;
    let streamStarted = false;
    let stream: MediaStream;

    const css = `
      :root {
        --main-color: ${options.brandColor ? options.brandColor : 'var(--primary)'};
      }
      
      #gvision-container {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        display: block;
        overflow: hidden;
        z-index: 998;
        background-color: #000;
      }
      
      #close-button {
        position: absolute;
        z-index: 1000;
        top: 20px;
        background-color: hsl(var(--main-color));
        border: 0;
        color: white;
        padding: 0.5rem;
        border-radius: 10px;
        font-size: 14px;
        text-transform: uppercase;
        font-weight: 500;
      }
      
      #close-button:dir(ltr) {
        right: 20px;
      }
      
      #close-button:dir(rtl) {
        left: 20px;
      }
      
      #gvision-capture-container.hidden {
        display: none;
      }
      
      #gvision-capture-container > video,
      #gvision-capture-container > canvas {
        position: fixed;
        display: block;
        user-select: none;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        animation: fadeIn 1.2s;
        z-index: 998;
        object-fit: cover;
        object-position: 50% 50%;
      }
      
      #gvision-capture-container > canvas {
        display: none;
      }
      
      #capture-button {
        position: fixed;
        z-index: 1000;
        bottom: 50px;
        left: calc(50% - 28px);
        background-color: hsl(var(--main-color));
        border: 0;
        color: white;
        padding: 1rem;
        border-radius: 100px;
        font-size: 14px;
        text-transform: uppercase;
        font-weight: 500;
      }
      
      #spinner {
        width: 64px;
        height: 64px;
        border: 8px solid;
        border-color: hsl(var(--main-color)) transparent hsl(var(--main-color)) transparent;
        border-radius: 50%;
        animation: spinner 1.2s infinite linear;
        display: none;
        z-index: 999;
        position: absolute;
        left: calc(50% - 32px);
        top: calc(50% - 32px);
      }
      
      #gvision-camera-overlay {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        line-height: 0;
        z-index: 998;
        background-color: rgba(0, 0, 0, 0.45);
        clip-path: polygon(0% 0%, 0% 100%, 5% 100%, 5% 25%, 95% 25%, 95% 95%, 5% 95%, 5% 100%, 100% 100%, 100% 0%);
      }
      
      #gvision-capture-container > p {
        z-index: 999;
        position: relative;
        color: rgba(255, 255, 255, 0.8);
        font-size: 20px;
        text-align: center;
        padding: 4rem;
      }
      
      #gvision-results-container {
        display: flex;
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 999;
        text-align: center;
        align-items: center;
        flex-direction: column;
        justify-content: center;
      }
      
      #gvision-results-container.hidden {
        display: none;
      }
      
      #gvision-results-container h3 {
        position: relative;
        z-index: 999;
        color: white;
        font-size: 20px;
        font-weight: 500;
      }
      
      #gvision-results-container .icon {
        position: absolute;
        top: 0;
        z-index: 999;
        margin: 2rem auto 1rem;
      }
      
      #gvision-results-container > p {
        position: absolute;
        top: 95px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 20px;
        z-index: 999;
        padding: 0rem 2rem;
      }
      
      #gvision-results-container ul {
        position: relative;
        z-index: 999;
        color: rgba(255, 255, 255, 0.8);
        padding: 1rem 2rem;
        width: 100%;
      }
      
      #gvision-results-container ul li {
        background-color: white;
        text-align: left;
        padding: 0.75rem 1.5rem;
        margin-bottom: 8px;
        border-radius: 60px;
        cursor: pointer;
        display: flex;
        color: #1E1E1E;
        font-size: 18px;
      }
      
      #gvision-results-container ul li.active {
        background-color: hsl(var(--main-color));
        color: white;
      }
      
      #gvision-results-container ul li p {
        flex: 1;
      }
      
      #gvision-results-container ul li span {
        font-weight: 600;
      }
      
      #buttons-container {
        z-index: 999;
        display: flex;
        gap: 1rem;
      }
      
      #buttons-container button {
        border-radius: 50px;
        padding: 0.5rem 2rem;
        background-color: white;
        border: 2px solid hsl(var(--main-color));
        font-weight: 600;
      }
      
      #buttons-container #try-again-btn {
        color: hsl(var(--main-color));
      }
      
      #buttons-container #confirm-btn {
        background-color: hsl(var(--main-color));
        color: white;
      }
      
      #screenshot {
        width: 100%;
        height: 100%;
        position: absolute;
      }
      
      #gvision-results-overlay {
        display: none;
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        line-height: 0;
        z-index: 998;
        background-color: rgba(0, 0, 0, 0.75);
      }
      
      #gvision-results-overlay.clipped {
        background-color: rgba(0, 0, 0, 0.45);
        clip-path: polygon(0% 0%, 0% 100%, 5% 100%, 5% 30%, 95% 30%, 95% 95%, 5% 95%, 5% 100%, 100% 100%, 100% 0%);
      }
      
      @keyframes spinner {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `;

    if (!document.getElementById('gvision-css')) {
      InjectCSS({ id: 'gvision-css', css });
    }

    const endSession = () => {
      stopStream();
      container.remove();
      document.getElementById('gvision-css').remove();
    };

    const tryAgain = () => {
      videoContainer.classList.remove('hidden');
      results.classList.add('hidden');
      results.innerHTML = '';
      const updatedConstraints = {
        ...defaultConstraints,
      };
      startStream(updatedConstraints);
    };

    const confirmLocation = () => {
      onSelect(selectedOutput ? selectedOutput : output[0]);
      endSession();
    };

    const container = document.createElement('div');
    container.id = 'gvision-container';
    container.dir = options.dir ? options.dir : 'ltr';
    document.body.appendChild(container);

    const videoContainer = document.createElement('div');
    videoContainer.id = 'gvision-capture-container';
    container.appendChild(videoContainer);

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    videoContainer.appendChild(video);

    const canvas = document.createElement('canvas');
    container.appendChild(videoContainer);

    const captureButton = document.createElement('button');
    captureButton.id = 'capture-button';
    if (options.captureButtonText) {
      captureButton.innerText = options.captureButtonText;
    } else {
      const captureIconImg = document.createElement('img');
      captureIconImg.src = 'https://img.icons8.com/material-rounded/24/ffffff/camera--v2.png';
      captureIconImg.width = 24;
      captureIconImg.height = 24;
      captureButton.appendChild(captureIconImg);
    }
    videoContainer.appendChild(captureButton);

    const spinner = document.createElement('div');
    spinner.id = 'spinner';
    videoContainer.appendChild(spinner);

    const cameraText = document.createElement('p');
    cameraText.id = 'camera-text';
    cameraText.innerText = options.cameraText ? options.cameraText : 'Point your camera towards a shop front';
    videoContainer.appendChild(cameraText);

    const cameraOverlay = document.createElement('div');
    cameraOverlay.id = 'gvision-camera-overlay';
    videoContainer.appendChild(cameraOverlay);

    const results = document.createElement('div');
    results.id = 'gvision-results-container';
    results.classList.add('hidden');
    container.appendChild(results);

    const resultsOverlay = document.createElement('div');
    resultsOverlay.id = 'gvision-results-overlay';

    const screenshot = document.createElement('img');
    screenshot.id = 'screenshot';

    const closeButton = document.createElement('button');
    closeButton.id = 'close-button';
    if (options.closeButtonText) {
      closeButton.innerText = options.closeButtonText;
    } else {
      const closeIconImg = document.createElement('img');
      closeIconImg.src = 'https://img.icons8.com/material-outlined/24/ffffff/delete-sign.png';
      closeIconImg.width = 18;
      closeIconImg.height = 18;
      closeButton.appendChild(closeIconImg);
    }
    closeButton.onclick = endSession;
    container.appendChild(closeButton);

    const showResults = () => {
      results.appendChild(resultsOverlay);
      results.appendChild(screenshot);

      results.classList.remove('hidden');
      resultsOverlay.style.display = 'block';

      if (output.length === 0) {
        const warningIconImg = document.createElement('img');
        warningIconImg.src = 'https://img.icons8.com/sf-regular-filled/96/ffffff/error.png';
        warningIconImg.width = 48;
        warningIconImg.height = 48;
        warningIconImg.classList.add('icon');
        results.appendChild(warningIconImg);

        const noResults = document.createElement('p');
        noResults.innerText = options.noResultsText
          ? options.noResultsText
          : `We couldn't quite figure out your location, try getting closer to the logo and capturing at a more direct angle`;
        results.appendChild(noResults);
        resultsOverlay.classList.add('clipped');
      }

      if (output.length > 0) {
        const resultsHeading = document.createElement('h3');
        resultsHeading.innerText = options.resultsHeadingText ? options.resultsHeadingText : 'Is this where you are?';
        results.appendChild(resultsHeading);
        resultsOverlay.classList.remove('clipped');

        const resultsList = document.createElement('ul');
        results.appendChild(resultsList);

        output.forEach((i) => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `<p>${i.properties.title}</p><span>${i.floorName}</span>`;
          listItem.onclick = () => {
            // Remove 'active' class from all list items
            const listItems = document.querySelectorAll('li');
            listItems.forEach((item) => {
              item.classList.remove('active');
            });

            // Add 'active' class to the clicked item
            listItem.classList.add('active');

            // Call selectItem function with the clicked item
            selectedOutput = i;
          };
          resultsList.appendChild(listItem);
        });

        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'buttons-container';
        results.appendChild(buttonsContainer);

        const tryAgainBtn = document.createElement('button');
        tryAgainBtn.id = 'try-again-btn';
        tryAgainBtn.innerText = options.tryAgainButtonText ? options.tryAgainButtonText : 'Try again';
        tryAgainBtn.onclick = tryAgain;
        buttonsContainer.appendChild(tryAgainBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.id = 'confirm-btn';
        confirmBtn.innerText = options.confirmButtonText ? options.confirmButtonText : 'Confirm';
        confirmBtn.onclick = confirmLocation;
        buttonsContainer.appendChild(confirmBtn);
      }
    };

    const displayLoading = () => {
      spinner.style.display = 'block';
    };

    const hideLoading = () => {
      spinner.style.display = 'none';
    };

    const analyzeScreenshot = async (imageSrc: string) => {
      output = [];
      try {
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${options.gVisionApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: imageSrc.split(',')[1], // remove "data:image/jpeg;base64," prefix
                },
                features: [
                  {
                    type: 'LOGO_DETECTION',
                    maxResults: 10,
                  },
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 10,
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error('Error detecting logos');
        }

        const data = await response.json();

        // console.log('data recognized', data);

        if (data.responses[0].textAnnotations?.length > 0) {
          data.responses[0].textAnnotations.forEach((result) => {
            result.dimension = calculateDimensions(result.boundingPoly.vertices);
          });
          data.responses[0].textAnnotations.sort((a, b) => b.dimension.area - a.dimension.area);
          data.responses[0].textAnnotations = data.responses[0].textAnnotations.slice(1, 11);
          output.push(...data.responses[0].textAnnotations.map((i) => i.description));
        }

        if (data.responses[0].logoAnnotations?.length > 0) {
          output.push(...data.responses[0].logoAnnotations.map((i) => i.description));
        }

        if (output.length > 0) {
          const comparationResults = compareResults(options.pois, output);
          comparationResults.sort((a, b) => b.score - a.score);
          output = comparationResults.slice(0, options.returnResults ? options.returnResults : 3);
          output = output.filter((i) => i.score > 0);
        }

        // console.log('output', output);

        showResults();
      } catch (e) {
        console.error('Error analyzing screenshot:', e);
      }
    };

    const stopStream = () => {
      if (streamStarted) {
        stream.getTracks().forEach((track) => track.stop());
        streamStarted = false;
        window.removeEventListener('touchstart', touchHandler);
      }
      videoContainer.classList.add('hidden');
      hideLoading();
    };

    const doScreenshot = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const imageSrc = canvas.toDataURL('image/jpeg');
      displayLoading();
      await analyzeScreenshot(imageSrc);
      screenshot.src = imageSrc;
      stopStream();
    };

    captureButton.onclick = doScreenshot;

    const handleStream = () => {
      video.srcObject = stream;
      streamStarted = true;
    };

    const startStream = async (constraints: MediaStreamConstraints) => {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleStream();
    };

    const touchHandler = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        if (streamStarted) event.preventDefault();
      }
    };

    window.addEventListener('touchstart', touchHandler, { passive: false });

    if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
      const updatedConstraints = {
        ...defaultConstraints,
      };
      startStream(updatedConstraints);
    }
  }
}

export { ImageDetection };
