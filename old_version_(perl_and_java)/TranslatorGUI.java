/**
 * This is the frontend of the program. It is a user interface
 * that allows users to type MATLAB code or load it from a file,
 * press a button to translate it into Julia, and then manipulate
 * and save the resulting Julia code.
 * 
 * During translation, the MATLAB code read from the interface is
 * saved to a temp file in the same directory as the class file.
 * The Perl script reads from this temp file and saves the Julia
 * translation to a second temp file. The interface reads in and
 * displays the Julia temp file and deletes both temp files.
 */

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Toolkit;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.FocusEvent;
import java.awt.event.FocusListener;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.concurrent.ExecutionException;
import javax.swing.GroupLayout;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.SwingWorker;

public class TranslatorGUI extends JFrame
{
    private JTextArea matlabField;
    private JTextArea juliaField;
    private JButton translateButton;
    
    private JTextField uploadLocationField;
    private JButton uploadButton;
    private JTextField saveLocationField;
    private JButton saveButton;
    
    private static final String UPLOAD_LOCATION_FIELD_INITIAL_TEXT = "please enter location";
    private static final String SAVE_LOCATION_FIELD_INITIAL_TEXT = "please enter location";
    
    private static final String DIRECTORY = "";
    private static final String MATLAB_TEMP_FILE = DIRECTORY + "MATLAB_temp.txt";
    private static final String JULIA_TEMP_FILE = DIRECTORY + "Julia_temp.txt";
    private static final String PERL_SCRIPT_FILE = DIRECTORY + "translator.pl";
    
    private static final Font FIELD_FONT = new Font("Courier", Font.PLAIN, 14);
    private static final Color FIELD_BACKGROUND_COLOR = Color.WHITE;
    private static final Color FIELD_LOADING_BACKGROUND_COLOR = Color.LIGHT_GRAY;
    
    /**
     * Creates a translator GUI with two text areas for the
     * MATLAB code to translate and the resulting Julia
     * code, a button to translate, and options for uploading
     * and saving MATLAB and Julia files, respectively.
     */
    public TranslatorGUI()
    {
        // sets qualities of the frame
        Dimension maxSize = Toolkit.getDefaultToolkit().getScreenSize();
        this.setSize(maxSize.width/2, maxSize.height/2);
        this.setResizable(false);
        
        // creates MATLAB field
        JLabel matlabLabel = new JLabel("MATLAB");
        matlabField = new JTextArea();
        matlabField.setFont(FIELD_FONT);
        JScrollPane matlabScroller = new JScrollPane(matlabField);
        matlabScroller.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
        matlabScroller.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
        
        // creates Julia field
        JLabel juliaLabel = new JLabel("Julia");
        juliaField = new JTextArea();
        juliaField.setEditable(false);
        juliaField.setFont(FIELD_FONT);
        JScrollPane juliaScroller = new JScrollPane(juliaField);
        juliaScroller.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
        juliaScroller.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
        
        // creates translate button
        translateButton = new JButton("translate!");
        translateButton.addActionListener(new ActionListener()
         {
             /**
             * Responds to user pressing the translate button.
             */
            @Override
            public void actionPerformed(ActionEvent e)
            {
                enableInteraction(false);
                
                // new thread for translating MATLAB code in background,
                // allowing the GUI to remain responsive
                new SwingWorker()
                {
                    /**
                     * Saves the entered MATLAB code and runs the backend
                     * translator script on it.
                     */
                    @Override
                    protected Object doInBackground() throws Exception
                    {
                        // saves MATLAB code entered
                        String textToTranslate = matlabField.getText();
                        try
                        {
                            saveToFile(MATLAB_TEMP_FILE, textToTranslate);
                        }
                        catch(FileNotFoundException ex)
                        {
                            displayErrorMessage("Could not save MATLAB code to temp file.");
                            return null;
                        }
                        catch(IOException ex)
                        {
                            displayErrorMessage("Could not save MATLAB code to temp file.");
                            return null;
                        }
                        
                        // runs Perl script to translate
                        runScript(PERL_SCRIPT_FILE);
                        return null;
                    }
                    
                    /**
                     * Blocks until the backend translator Perl script is done running, then
                     * retrieves and displays the translation from the temp file created by
                     * the Perl scipt and deletes all temp files.
                     */
                    @Override
                    protected void done()
                    {
                        try
                        {
                            get();
                        }
                        catch (InterruptedException e)
                        {
                            displayErrorMessage("Perl script terminated.");
                        }
                        catch (ExecutionException e)
                        {
                            displayErrorMessage("Perl script terminated.");
                        }
                        
                        // retrieves file saved by Perl
                        try
                        {
                            String translatedText = retrieveFromFile(JULIA_TEMP_FILE);
                            juliaField.setText(translatedText);
                        }
                        catch(FileNotFoundException ex)
                        {
                            displayErrorMessage("Could not load Julia code from temp file created by Perl script.");
                        }
                        catch(IOException ex)
                        {
                            displayErrorMessage("Could not load Julia code from temp file created by Perl script.");
                        }
                        
                        // deletes temp files
                        try
                        {
                            deleteFile(MATLAB_TEMP_FILE);
                            deleteFile(JULIA_TEMP_FILE);
                        }
                        catch(FileNotFoundException ex)
                        {
                            displayErrorMessage("Could not delete temp files.");
                        }
                        catch(IOException ex)
                        {
                            displayErrorMessage("Could not delete temp files.");
                        }
                        
                        enableInteraction(true);
                    }
                }.execute();
            }
        });
        
        // creates upload location field
        uploadLocationField = new JTextField();
        uploadLocationField.addFocusListener(new FocusListener()
        {
            /**
             * Responds to user clicking the upload location field for the
             * first time by deleting the initial text and making any new text
             * typed black (rather than grey).
             */
            @Override
            public void focusGained(FocusEvent e)
            {
                if(uploadLocationField.getText().equals(UPLOAD_LOCATION_FIELD_INITIAL_TEXT))
                {
                    uploadLocationField.setText("");
                    uploadButton.setEnabled(true);
                }
            }

            @Override
            public void focusLost(FocusEvent e) { }
        });
        uploadLocationField.setText(UPLOAD_LOCATION_FIELD_INITIAL_TEXT);
        
        // creates upload location button
        uploadButton = new JButton("load MATLAB code");
        uploadButton.addActionListener(new ActionListener()
        {
            /**
             * Reacts to to the user pressing the upload button.
             */
            @Override
            public void actionPerformed(ActionEvent e)
            {
                String fileName = uploadLocationField.getText();
                try
                {
                    String matlabCode = retrieveFromFile(fileName);
                    matlabField.setText(matlabCode);
                }
                catch(FileNotFoundException ex)
                {
                    displayErrorMessage("Could not load MATLAB code from specified location.");
                }
                catch(IOException ex)
                {
                    displayErrorMessage("Could not load MATLAB code from specified location.");
                }
            }
        });
        uploadButton.setEnabled(false);
        
        // creates save location field
        saveLocationField = new JTextField();
        saveLocationField.addFocusListener(new FocusListener()
        {
            /**
             * Responds to user clicking the save location field for the
             * first time by deleting the initial text and making any new text
             * typed black (rather than grey).
             */
            @Override
            public void focusGained(FocusEvent e)
            {
                if(saveLocationField.getText().equals(UPLOAD_LOCATION_FIELD_INITIAL_TEXT))
                {
                    saveLocationField.setText("");
                    saveButton.setEnabled(true);
                }
            }

            @Override
            public void focusLost(FocusEvent e) { }
        });
        saveLocationField.setText(SAVE_LOCATION_FIELD_INITIAL_TEXT);
        
        // creates save location button
        saveButton = new JButton("save Julia code");
        saveButton.addActionListener(new ActionListener()
        {
            /**
             * Reacts to to the user pressing the save button.
             */
            @Override
            public void actionPerformed(ActionEvent e)
            {
                String fileName = saveLocationField.getText();
                String juliaCode = juliaField.getText();
                try
                {
                    saveToFile(fileName, juliaCode);
                }
                catch(FileNotFoundException ex)
                {
                    displayErrorMessage("Could not save Julia code to specified location.");
                }
                catch(IOException ex)
                {
                    displayErrorMessage("Could not save Julia code to specified location.");
                }
            }
        });
        saveButton.setEnabled(false);
        
        // distributes items in frame
        GroupLayout layout = new GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setAutoCreateGaps(true);
        layout.setAutoCreateContainerGaps(true);

        layout.setHorizontalGroup(layout.createParallelGroup()
            .addGroup(layout.createSequentialGroup()
                .addGroup(layout.createParallelGroup()
                    .addComponent(matlabLabel)
                    .addComponent(matlabScroller)
                    .addGroup(layout.createSequentialGroup()
                            .addComponent(uploadLocationField)
                            .addComponent(uploadButton)))
                .addGroup(layout.createParallelGroup()
                    .addComponent(juliaLabel)
                    .addComponent(juliaScroller)
                    .addGroup(layout.createSequentialGroup()
                            .addComponent(saveLocationField)
                            .addComponent(saveButton))))
            .addGroup(layout.createSequentialGroup()
                    .addGap(this.getWidth()/2 - 55)
                    .addComponent(translateButton))
        );

        layout.setVerticalGroup(layout.createSequentialGroup()
            .addGroup(layout.createParallelGroup()
                .addGroup(layout.createSequentialGroup()
                    .addComponent(matlabLabel)
                    .addComponent(matlabScroller)
                    .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING, false)
                            .addComponent(uploadLocationField, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addComponent(uploadButton, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)))
                .addGroup(layout.createSequentialGroup()
                    .addComponent(juliaLabel)
                    .addComponent(juliaScroller)
                    .addGroup(layout.createParallelGroup(GroupLayout.Alignment.LEADING, false)
                            .addComponent(saveLocationField, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                            .addComponent(saveButton, GroupLayout.DEFAULT_SIZE, GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))))
            .addComponent(translateButton)
        );
        layout.linkSize(SwingConstants.HORIZONTAL, uploadButton, saveButton);
        
        // sets qualities of the frame
        this.setTitle("MATLAB -> Julia Translator");
        this.setDefaultCloseOperation(EXIT_ON_CLOSE);
        this.setVisible(true);
    }
    
    /**
     * Displays the parameter error message and, once the user closes the error
     * message, re-enables the translator window.
     * 
     * @param message The error message to be displayed. Cannot be null.
     */
    private void displayErrorMessage(String message)
    {
        enableInteraction(false);
        JOptionPane.showMessageDialog(null, message, "Connection Error", JOptionPane.ERROR_MESSAGE);
        enableInteraction(true);
    }
    
    /**
     * Either enables or disables interaction with the GUI
     * through the text areas, fields, and buttons.
     * 
     * @param enabled true if interaction should be enabled,
     * false if it should be disabled.
     */
    private void enableInteraction(boolean enabled)
    {
        if(enabled)
        {
            juliaField.setBackground(FIELD_BACKGROUND_COLOR);
            matlabField.setBackground(FIELD_BACKGROUND_COLOR);
            uploadLocationField.setBackground(FIELD_BACKGROUND_COLOR);
            saveLocationField.setBackground(FIELD_BACKGROUND_COLOR);
            
            if(!uploadLocationField.getText().equals(UPLOAD_LOCATION_FIELD_INITIAL_TEXT))
            {
                uploadButton.setEnabled(true);
            }
            if(!saveLocationField.getText().equals(SAVE_LOCATION_FIELD_INITIAL_TEXT))
            {
                saveButton.setEnabled(true);
            }
            
            if(juliaField.getText().length() > 0)
            {
                juliaField.setEditable(true);
            }
        }
        else
        {
            juliaField.setBackground(FIELD_LOADING_BACKGROUND_COLOR);
            juliaField.setEditable(false);
            matlabField.setBackground(FIELD_LOADING_BACKGROUND_COLOR);
            uploadLocationField.setBackground(FIELD_LOADING_BACKGROUND_COLOR);
            saveLocationField.setBackground(FIELD_LOADING_BACKGROUND_COLOR);
            uploadButton.setEnabled(false);
            saveButton.setEnabled(false);
        }
        
        uploadLocationField.setEditable(enabled);
        saveLocationField.setEditable(enabled);
        translateButton.setEnabled(enabled);
        matlabField.setEditable(enabled);
        matlabField.getCaret().setVisible(true);
        matlabField.requestFocusInWindow();
    }
    
    /**
     * Runs a Perl script to translate the MATLAB code temp file
     * at the parameter location into Julia. The resulting
     * translated Julia code will be in the same directory, also
     * as a temp file, named Julia_temp.txt (the value of
     * JULIA_TEMP_FILE).
     * 
     * @param fileName The location of the Perl script to run.
     * Must point to a valid Perl script, which will translate
     * the text in the file at MATLAB_TEMP_FILE and print the
     * output to a new file at JULIA_TEMP_FILE.
     * @return true if the translation was successful, false
     * otherwise.
     */
    private boolean runScript(String fileName)
    {
        try
        {
            Process process = Runtime.getRuntime().exec("perl " + fileName);
            process.waitFor();
            return true;
        }
        catch (IOException e1)
        {
            e1.printStackTrace();
            return false;
        }
        catch (InterruptedException e)
        {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Saves the parameter text to a file at the parameter location.
     * 
     * @param fileName The location at which to save the new file.
     * Must be a valid path.
     * @param text The text to save. Must not be null.
     */
    private void saveToFile(String fileName, String text) throws IOException, FileNotFoundException
    {
        PrintWriter out = new PrintWriter(fileName);
        out.println(text);
        out.close();
    }
    
    /**
     * Retrieves the text from the file at the parameter location.
     * 
     * @param fileName The location from which to retrieve the text.
     * Must be a valid path of a valid text file.
     * @return The text retrieved from that file.
     */
    private String retrieveFromFile(String fileName) throws IOException, FileNotFoundException
    {
        BufferedReader in = new BufferedReader(new FileReader(new File(fileName)));
        StringBuilder contents = new StringBuilder();
        boolean firstLine = true;
        while(in.ready())
        {
            if(!firstLine)
            {
                contents.append("\n");
            }
            else
            {
                firstLine = false;
            }
            contents.append(in.readLine());
        }
        in.close();
        return contents.toString();
    }
    
    /**
     * Deletes the file at the parameter location. Used to
     * delete temp files created by this program and the
     * Perl program used.
     * 
     * @param fileName The location of the file to delete.
     * Must be a path to a valid file.
     */
    private void deleteFile(String fileName) throws IOException, FileNotFoundException
    {
        File file = new File(fileName);
        file.delete();
    }
    
    /**
     * Runs the translator GUI.
     * 
     * @param args
     */
    public static void main(final String[] args)
    {
        new TranslatorGUI();
    }
}
