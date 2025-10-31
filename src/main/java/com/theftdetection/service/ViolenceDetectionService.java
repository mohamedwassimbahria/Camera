package com.theftdetection.service;

import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;
import org.deeplearning4j.nn.modelimport.keras.KerasModelImport;
import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.nd4j.common.io.ClassPathResource;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.factory.Nd4j;
import org.nd4j.linalg.indexing.NDArrayIndex;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ViolenceDetectionService {

    private MultiLayerNetwork model;

    public ViolenceDetectionService() {
        try {
            File modelFile = new ClassPathResource("models/violence_detection_model.keras").getFile();
            model = KerasModelImport.importKerasSequentialModelAndWeights(modelFile.getAbsolutePath());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public boolean detectViolence(File videoFile) {
        try {
            List<BufferedImage> frames = extractFrames(videoFile);
            INDArray input = preprocessFrames(frames);
            INDArray output = model.output(input);
            return output.getDouble(0) > 0.5; // Assuming the model outputs a single value between 0 and 1
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private List<BufferedImage> extractFrames(File videoFile) throws Exception {
        List<BufferedImage> frames = new ArrayList<>();
        FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(videoFile);
        grabber.start();
        Java2DFrameConverter converter = new Java2DFrameConverter();
        for (int i = 0; i < grabber.getLengthInFrames(); i++) {
            Frame frame = grabber.grab();
            if (frame == null) {
                break;
            }
            frames.add(converter.getBufferedImage(frame));
        }
        grabber.stop();
        return frames;
    }

    private INDArray preprocessFrames(List<BufferedImage> frames) {
        // This is a placeholder for the preprocessing logic.
        // You will need to resize the frames to the expected input size of your model,
        // normalize the pixel values, and arrange them into a 4D tensor.
        // For example, if your model expects 10 frames of size 224x224 with 3 channels,
        // the shape of the INDArray should be [1, 10, 224, 224, 3].
        return Nd4j.zeros(1, 10, 224, 224, 3);
    }
}
