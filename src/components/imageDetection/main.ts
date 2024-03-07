import { InjectCSS } from '../../common';
import { SortedPoiItemModel } from '../../models/sortedPoiItemModel';
import { compareResults } from './comparator';

interface Options {
  gVisionApiKey: string;
  pois: SortedPoiItemModel[];
  captureButtonText?: string;
  closeButtonText?: string;
  noResultsText?: string;
  resultsHeadingText?: string;
  returnResults?: number;
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

const css = `
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

    > video,
    > canvas {
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

    > canvas {
      display: none;
    }

    #capture-button {
      position: fixed;
      z-index: 999;
      width: 180px;
      bottom: 20px;
      left: calc(50% - 90px);
      background-color: rgb(206, 26, 26);
      border: 0;
      color: white;
      padding: 1rem 2rem;
      border-radius: 6px;
      font-size: 14px;
      text-transform: uppercase;
      font-weight: 500;
    }

    #spinner {
      width: 64px;
      height: 64px;
      border: 8px solid;
      border-color: #3d5af1 transparent #3d5af1 transparent;
      border-radius: 50%;
      animation: spinner 1.2s infinite linear;
      display: none;
      z-index: 999;
      position: absolute;
      left: calc(50% - 32px);
      top: calc(50% - 32px);
    }
	}

  #gvision-results-container {
    display: none;
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

    #close-button {
      position: fixed;
      z-index: 999;
      width: 180px;
      bottom: 20px;
      left: calc(50% - 90px);
      background-color: rgb(206, 26, 26);
      border: 0;
      color: white;
      padding: 1rem 2rem;
      border-radius: 6px;
      font-size: 14px;
      text-transform: uppercase;
      font-weight: 500;
    }

    h3 {
      color: white;
      color: white;
      font-size: 26px;
      margin-top: 25px;
      font-weight: 500;
    }

    >p {
      position: relative;
      color: rgba(255, 255, 255, .8);
      top: 30%;
      font-size: 20px;
    }

    ul {
      position: relative;
      color: rgba(255, 255, 255, .8);
      top: 10px;
      padding: 1rem 2rem;

      li {
        background-color: rgba(0, 0, 0, .5);
        text-align: left;
        padding: 1rem;
        margin-bottom: 8px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;

        p {
          flex: 1;
        }

        span {
          color: rgba(255, 255, 255, .5);
        }

        &:hover {
          background-color: rgba(0, 0, 0, .8);
        }
      }
    }
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

  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

class ImageDetection {
  static init(options: Options, onSelect: (item: SortedPoiItemModel) => void) {
    let streamStarted = false;

    if (!document.getElementById('gvision-css')) {
      InjectCSS({ id: 'gvision-css', css });
    }

    const container = document.createElement('div');
    container.id = 'gvision-container';
    document.body.appendChild(container);

    const video = document.createElement('video');
    video.autoplay = true;
    container.appendChild(video);

    const canvas = document.createElement('canvas');
    document.body.appendChild(container);

    const captureButton = document.createElement('button');
    captureButton.id = 'capture-button';
    captureButton.innerText = options.captureButtonText ? options.captureButtonText : 'Capture';

    const spinner = document.createElement('div');
    spinner.id = 'spinner';
    container.appendChild(spinner);

    const results = document.createElement('div');
    results.id = 'gvision-results-container';
    document.body.appendChild(results);

    const resultsOverlay = document.createElement('div');
    resultsOverlay.id = 'gvision-results-overlay';
    document.body.appendChild(resultsOverlay);

    const selectItem = (item: SortedPoiItemModel) => {
      onSelect(item);
      endSession();
    };

    const endSession = () => {
      results.remove();
      resultsOverlay.remove();
      document.getElementById('gvision-css').remove();
    };

    const showResults = (output: SortedPoiItemModel[]) => {
      results.style.display = 'block';
      resultsOverlay.style.display = 'block';

      const closeButton = document.createElement('button');
      closeButton.id = 'close-button';
      closeButton.innerText = options.closeButtonText ? options.closeButtonText : 'Close';

      results.appendChild(closeButton);

      closeButton.onclick = endSession;

      if (output.length === 0) {
        const noResults = document.createElement('p');
        noResults.innerText = options.noResultsText
          ? options.noResultsText
          : `Sorry we didn't found any results. You can close this window and try again.`;
        results.appendChild(noResults);
      }

      if (output.length > 0) {
        const resultsHeading = document.createElement('h3');
        resultsHeading.innerText = options.resultsHeadingText ? options.resultsHeadingText : 'You are at: ';
        results.appendChild(resultsHeading);

        const resultsList = document.createElement('ul');
        results.appendChild(resultsList);

        output.forEach((i) => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `<p>${i.properties.title}</p><span>${i.floorName}</span>`;
          listItem.onclick = () => {
            selectItem(i);
          };
          resultsList.appendChild(listItem);
        });
      }
    };

    const displayLoading = () => {
      spinner.style.display = 'block';
    };

    const hideLoading = () => {
      spinner.style.display = 'none';
    };

    const analyzeScreenshot = async (imageSrc: string) => {
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

        let output = [];
        if (data.responses[0].textAnnotations?.length > 0) {
          output.push(...data.responses[0].textAnnotations.map((i) => i.description));
        }
        if (data.responses[0].logoAnnotations?.length > 0) {
          output.push(...data.responses[0].logoAnnotations.map((i) => i.description));
        }
        output = output.slice(1);

        if (output.length > 0) {
          const comparationResults = compareResults(options.pois, output);
          comparationResults.sort((a, b) => b.score - a.score);
          output = comparationResults.slice(0, options.returnResults ? options.returnResults : 3);
        }

        showResults(output);
      } catch (e) {
        console.error('Error analyzing screenshot:', e);
      }
    };

    const doScreenshot = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const imageSrc = canvas.toDataURL('image/jpeg');
      displayLoading();
      await analyzeScreenshot(imageSrc);
      container.remove();
    };

    captureButton.onclick = doScreenshot;

    const handleStream = (stream: MediaStream) => {
      video.srcObject = stream;
      streamStarted = true;
      container.appendChild(captureButton);
    };

    const startStream = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleStream(stream);
    };

    if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
      const updatedConstraints = {
        ...defaultConstraints,
      };
      startStream(updatedConstraints);
    }
  }
}

export { ImageDetection };
