# Safety Glasses Monitor

A web-based monitoring system for FTC teams to ensure workspace safety compliance by detecting whether team members are wearing safety glasses using OpenAI's Vision API.

## Features

- **Real-time Monitoring**: Continuously monitors workspace using webcam
- **Periodic Checks**: Automatically checks for safety glasses compliance at configurable intervals
- **Visual Alerts**: Red banner and status indicators when violations are detected
- **Audio Alerts**: Optional sound notifications for violations
- **Easy Setup**: Simple web interface with minimal configuration

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- OpenAI API key
- Webcam or camera device
- Modern web browser with camera permissions

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   Replace `your_openai_api_key_here` with your actual OpenAI API key. You can get one from [OpenAI's website](https://platform.openai.com/api-keys).

## Usage

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open your browser**:
   Navigate to `http://localhost:3000`

3. **Grant camera permissions**:
   When prompted, allow the browser to access your camera

4. **Start monitoring**:
   - Click "Start Monitoring" button
   - Adjust the check interval if needed (default: 15 seconds)
   - Enable/disable audio alerts as desired

5. **Monitor the workspace**:
   - The system will automatically check for safety glasses at the set interval
   - Visual and audio alerts will trigger when violations are detected
   - Status indicators show current compliance status

## Configuration

### Check Interval
Adjust the check interval in the Settings section. The default is 15 seconds, and you can set it between 5-60 seconds.

### Audio Alerts
Toggle audio alerts on/off using the checkbox in Settings. Audio alerts play a beep sound when violations are detected.

## How It Works

1. The web application accesses your webcam through the browser
2. Periodically captures frames from the video stream
3. Sends images to the backend server
4. Backend uses OpenAI's GPT-4 Vision API to analyze the image
5. Returns detection result (wearing glasses or not)
6. Frontend displays alerts if violations are detected

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/check-safety-glasses` - Analyzes an image for safety glasses compliance

## Troubleshooting

### Camera not working
- Ensure you've granted camera permissions in your browser
- Check that no other application is using the camera
- Try refreshing the page and granting permissions again

### API errors
- Verify your OpenAI API key is correct in the `.env` file
- Check that you have sufficient API credits
- Ensure you have internet connectivity

### Server won't start
- Make sure Node.js is installed (`node --version`)
- Verify all dependencies are installed (`npm install`)
- Check that port 3000 is not already in use

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already included in `.gitignore`
- Keep your OpenAI API key secure and don't share it

## License

MIT

## Support

For issues or questions, please check the troubleshooting section or review the code comments for implementation details.

